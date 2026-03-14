// Tests are NOT concurrent for two reasons:
// 1. __setAppReducerDispatchProxyFactory / __clearAppReducerDispatchProxy use shared module-level mutable state.
//    Concurrent tests would interfere with each other's dispatch proxy.
// 2. renderUseDeferredRegistrationsHook uses renderHook's rerender to update context providers via closures.
//    The global afterEach cleanup in vitest-setup.ts calls @testing-library/react's cleanup(), which unmounts
//    ALL roots. With concurrent tests, a fast test's cleanup would unmount roots from slower tests mid-rerender.

import { LocalModuleRegistry } from "@squide/core/internal";
import {
    FireflyProvider,
    FireflyRuntime,
    ModuleManager,
    ModuleRegistrationError,
    MswPlugin,
    toLocalModuleDefinitions,
    useDeferredRegistrations,
    type DeferredRegistrationsErrorCallback
} from "@squide/firefly";
import {
    AppRouterDispatch,
    AppRouterDispatcherContext,
    AppRouterState,
    AppRouterStateContext,
    __clearAppReducerDispatchProxy,
    __setAppReducerDispatchProxyFactory,
    useAppRouterReducer
} from "@squide/firefly/internal";
import { createDefaultAppRouterState } from "@squide/firefly/tests";
import { act, renderHook, waitFor, type RenderHookOptions } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import type { ReactNode } from "react";
import { afterEach, test, vi, type Mock } from "vitest";
import { RemoteModuleRegistrationError, RemoteModuleRegistry, toRemoteModuleDefinitions } from "../src/RemoteModuleRegistry.ts";
import { sleep } from "./utils.ts";

function renderUseAppReducerHook<TProps>(runtime: FireflyRuntime, additionalProps: RenderHookOptions<TProps> = {}) {
    return renderHook(() => useAppRouterReducer(true, true), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <FireflyProvider runtime={runtime}>
                {children}
            </FireflyProvider>
        ),
        ...additionalProps
    });
}

interface RenderUseDeferredRegistrationsHookProps {
    data: unknown;
    state: AppRouterState;
    dispatch: AppRouterDispatch;
}

// Uses closure variables for state/dispatch and exposes a custom rerender that updates them before
// triggering a re-render. This allows tests to update both the hook's data and the context providers in a single rerender call.
function renderUseDeferredRegistrationsHook(runtime: FireflyRuntime, initialProps: RenderUseDeferredRegistrationsHookProps, onError?: DeferredRegistrationsErrorCallback) {
    let {
        state,
        dispatch
    } = initialProps;

    const { rerender, ...rest } = renderHook(({ data }: { data: unknown }) => useDeferredRegistrations(data, { onError }), {
        initialProps: { data: initialProps.data },
        wrapper: ({ children }: { children?: ReactNode }) => (
            <FireflyProvider runtime={runtime}>
                <AppRouterDispatcherContext.Provider value={dispatch}>
                    <AppRouterStateContext.Provider value={state}>
                        {children}
                    </AppRouterStateContext.Provider>
                </AppRouterDispatcherContext.Provider>
            </FireflyProvider>
        )
    });

    return {
        ...rest,
        rerender: ({ data, state: _state, dispatch: _dispatch }: RenderUseDeferredRegistrationsHookProps) => {
            state = _state;
            dispatch = _dispatch;

            rerender({ data });
        }
    };
}

afterEach(() => {
    __clearAppReducerDispatchProxy();
});

test("when local and remote modules are registered but not ready, global data is ready and msw is ready, register the deferred registrations", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    let dispatch: Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = vi.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const initialData = {
        foo: "bar"
    };

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, { state, dispatch, data: initialData });

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "modules-ready" }));
});

test("when local and remote modules are ready, msw is ready, and the data change, update the deferred registrations", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    let dispatch: Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = vi.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const initialData = {
        foo: "bar"
    };

    // Step 1: Registration — modules registered but not ready.
    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { rerender } = renderUseDeferredRegistrationsHook(runtime, { state: state1, dispatch, data: initialData });

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "modules-ready" }));

    // Step 2: Modules are now ready — the update effect activates for the first time but is
    // skipped by the initial ref guard (spurious update prevention).
    const state2 = createDefaultAppRouterState();
    state2.areModulesReady = true;

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rerender({ state: state2, dispatch, data: initialData });

    // Step 3: Data changes, the update effect fires and updates the deferred registrations.
    const updatedData = {
        foo: "toto"
    };

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rerender({ state: state2, dispatch, data: updatedData });

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "deferred-registrations-updated" }));
});

test("when local and remote modules are ready, msw is ready, and the feature flags changed, update the deferred registrations", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    let dispatch: Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = vi.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const initialData = {
        foo: "bar"
    };

    // Step 1: Registration — modules registered but not ready.
    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { rerender } = renderUseDeferredRegistrationsHook(runtime, { state: state1, dispatch, data: initialData });

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "modules-ready" }));

    // Step 2: Modules are now ready — the update effect activates for the first time but is
    // skipped by the initial ref guard (spurious update prevention).
    const state2 = createDefaultAppRouterState();
    state2.areModulesReady = true;

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rerender({ state: state2, dispatch, data: initialData });

    // Step 3: Feature flags change — dispatch to the runtime store to update featureFlagsUpdatedAt,
    // which is a direct dependency of the update effect.
    runtime.appRouterStore.dispatch({ type: "feature-flags-updated" });

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rerender({ state: state2, dispatch, data: initialData });

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "deferred-registrations-updated" }));
});

test("when local and remote modules are not registered, do not register the deferred registrations", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    let dispatch: Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = vi.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = false;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const initialData = {
        foo: "bar"
    };

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, { state, dispatch, data: initialData });

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(dispatch).not.toHaveBeenCalledWith({ type: "modules-ready" });
});

test("when local and remote modules are ready, msw is ready, but the data reference hasn't changed, do not update the deferred registrations", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    let dispatch: Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = vi.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const data = {
        foo: "bar"
    };

    // Step 1: Registration — modules registered but not ready.
    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { rerender } = renderUseDeferredRegistrationsHook(runtime, { state: state1, dispatch, data });

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "modules-ready" }));

    // Step 2: Modules are now ready — the update effect activates for the first time but is
    // skipped by the initial ref guard (spurious update prevention).
    const state2 = createDefaultAppRouterState();
    state2.areModulesReady = true;

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rerender({ state: state2, dispatch, data });

    // Step 3: Rerender with the same data reference — the effect should not re-fire.
    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rerender({ state: state2, dispatch, data });

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(dispatch).not.toHaveBeenCalledWith({ type: "deferred-registrations-updated" });
});

test("when an error occurs while registering the deferred registrations of the local modules, invoke the onError callback", async ({ expect }) => {
    const localModuleRegistrationError = new ModuleRegistrationError("toto");
    const localModuleRegistry = new LocalModuleRegistry();

    vi.spyOn(localModuleRegistry, "registerDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            localModuleRegistrationError
        ]);
    });

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => vi.fn());

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const initialData = {
        foo: "bar"
    };

    const dispatch = vi.fn();
    const onError = vi.fn();

    renderUseDeferredRegistrationsHook(runtime, { state, dispatch, data: initialData }, onError);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.arrayContaining([localModuleRegistrationError])
    ));
});

test("when an error occurs while registering the deferred registrations of the remote modules, invoke the onError callback", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistrationError = new RemoteModuleRegistrationError("toto", "foo", "bar");
    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    vi.spyOn(remoteModuleRegistry, "registerDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            remoteModuleRegistrationError
        ]);
    });

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => vi.fn());

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const initialData = {
        foo: "bar"
    };

    const dispatch = vi.fn();
    const onError = vi.fn();

    renderUseDeferredRegistrationsHook(runtime, { state, dispatch, data: initialData }, onError);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.arrayContaining([remoteModuleRegistrationError])
    ));
});

test("when an error occurs while registering the deferred registrations of the local & remote modules, invoke the onError callback", async ({ expect }) => {
    const localModuleRegistrationError = new ModuleRegistrationError("toto");
    const localModuleRegistry = new LocalModuleRegistry();

    vi.spyOn(localModuleRegistry, "registerDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            localModuleRegistrationError
        ]);
    });

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistrationError = new RemoteModuleRegistrationError("toto", "foo", "bar");
    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    vi.spyOn(remoteModuleRegistry, "registerDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            remoteModuleRegistrationError
        ]);
    });

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => vi.fn());

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;

    const initialData = {
        foo: "bar"
    };

    const dispatch = vi.fn();
    const onError = vi.fn();

    renderUseDeferredRegistrationsHook(runtime, { state, dispatch, data: initialData }, onError);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.arrayContaining([localModuleRegistrationError, remoteModuleRegistrationError])
    ));
});

test("when an error occurs while updating the deferred registrations of the local modules, invoke the onError callback", async ({ expect }) => {
    const localModuleRegistrationError = new ModuleRegistrationError("toto");
    const localModuleRegistry = new LocalModuleRegistry();

    vi.spyOn(localModuleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([localModuleRegistrationError]);
    });

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => vi.fn());

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const dispatch = vi.fn();
    const onError = vi.fn();

    const initialData = {
        foo: "bar"
    };

    // Step 1: Registration — modules registered but not ready.
    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;

    const { rerender } = renderUseDeferredRegistrationsHook(runtime, { state: state1, dispatch, data: initialData }, onError);

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    expect(onError).not.toHaveBeenCalled();

    // Step 2: Modules are now ready — the update effect activates for the first time but is
    // skipped by the initial ref guard (spurious update prevention).
    const state2 = createDefaultAppRouterState();
    state2.areModulesReady = true;

    rerender({ state: state2, dispatch, data: initialData });

    // Step 3: Data changes, the update effect fires and the error callback is invoked.
    const updatedData = {
        foo: "toto"
    };

    rerender({ state: state2, dispatch, data: updatedData });

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.arrayContaining([localModuleRegistrationError])
    ));
});

test("when an error occurs while updating the deferred registrations of the remote modules, invoke the onError callback", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistrationError = new RemoteModuleRegistrationError("toto", "foo", "bar");
    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    vi.spyOn(remoteModuleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([remoteModuleRegistrationError]);
    });

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => vi.fn());

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const dispatch = vi.fn();
    const onError = vi.fn();

    const initialData = {
        foo: "bar"
    };

    // Step 1: Registration — modules registered but not ready.
    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;

    const { rerender } = renderUseDeferredRegistrationsHook(runtime, { state: state1, dispatch, data: initialData }, onError);

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    expect(onError).not.toHaveBeenCalled();

    // Step 2: Modules are now ready — the update effect activates for the first time but is
    // skipped by the initial ref guard (spurious update prevention).
    const state2 = createDefaultAppRouterState();
    state2.areModulesReady = true;

    rerender({ state: state2, dispatch, data: initialData });

    // Step 3: Data changes, the update effect fires and the error callback is invoked.
    const updatedData = {
        foo: "toto"
    };

    rerender({ state: state2, dispatch, data: updatedData });

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.arrayContaining([remoteModuleRegistrationError])
    ));
});

test("when an error occurs while updating the deferred registrations of the local & remote modules, invoke the onError callback", async ({ expect }) => {
    const localModuleRegistrationError = new ModuleRegistrationError("toto");
    const localModuleRegistry = new LocalModuleRegistry();

    vi.spyOn(localModuleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([localModuleRegistrationError]);
    });

    const loadRemote = vi.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistrationError = new RemoteModuleRegistrationError("toto", "foo", "bar");
    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    vi.spyOn(remoteModuleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([remoteModuleRegistrationError]);
    });

    const runtime = new FireflyRuntime({
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry,
            remoteModuleRegistry
        ]),
        plugins: [
            x => new MswPlugin(x)
        ],
        loggers: [new NoopLogger()]
    });

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => vi.fn());

    renderUseAppReducerHook(runtime);

    await runtime.moduleManager.registerModules([
        ...toLocalModuleDefinitions([
            () => () => {}
        ]),
        ...toRemoteModuleDefinitions([
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ])
    ]);

    const dispatch = vi.fn();
    const onError = vi.fn();

    const initialData = {
        foo: "bar"
    };

    // Step 1: Registration — modules registered but not ready.
    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;

    const { rerender } = renderUseDeferredRegistrationsHook(runtime, { state: state1, dispatch, data: initialData }, onError);

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    expect(onError).not.toHaveBeenCalled();

    // Step 2: Modules are now ready — the update effect activates for the first time but is
    // skipped by the initial ref guard (spurious update prevention).
    const state2 = createDefaultAppRouterState();
    state2.areModulesReady = true;

    rerender({ state: state2, dispatch, data: initialData });

    // Step 3: Data changes, the update effect fires and the error callback is invoked.
    const updatedData = {
        foo: "toto"
    };

    rerender({ state: state2, dispatch, data: updatedData });

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.arrayContaining([localModuleRegistrationError, remoteModuleRegistrationError])
    ));
});
