import { __clearLocalModuleRegistry, __setLocalModuleRegistry, LocalModuleRegistry, registerLocalModules, RuntimeContext, type ModuleRegistrationError, type Runtime } from "@squide/core";
import { __clearRemoteModuleRegistry, __setRemoteModuleRegistry, registerRemoteModules, RemoteModuleRegistry, type RemoteModuleRegistrationError } from "@squide/module-federation";
import { act, renderHook, waitFor, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";
import { AppRouterDispatcherContext, AppRouterStateContext } from "../src/AppRouterContext.ts";
import { __clearAppReducerDispatchProxy, __setAppReducerDispatchProxyFactory, useAppRouterReducer, type AppRouterDispatch, type AppRouterState } from "../src/AppRouterReducer.ts";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";
import { useDeferredRegistrations, type DeferredRegistrationsErrorCallback } from "../src/useDeferredRegistrations.ts";
import { createDefaultAppRouterState, sleep } from "./utils.ts";

function renderUseAppReducerHook<TProps>(runtime: Runtime, additionalProps: RenderHookOptions<TProps> = {}) {
    return renderHook(() => useAppRouterReducer(true, true, true), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <RuntimeContext.Provider value={runtime}>
                {children}
            </RuntimeContext.Provider>
        ),
        ...additionalProps
    });
}

function renderUseDeferredRegistrationsHook<TProps>(runtime: Runtime, state: AppRouterState, dispatch: AppRouterDispatch, data: unknown, onError?: DeferredRegistrationsErrorCallback, additionalProps: RenderHookOptions<TProps> = {}) {
    return renderHook(() => useDeferredRegistrations(data, { onError }), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <RuntimeContext.Provider value={runtime}>
                <AppRouterDispatcherContext.Provider value={dispatch}>
                    <AppRouterStateContext.Provider value={state}>
                        {children}
                    </AppRouterStateContext.Provider>
                </AppRouterDispatcherContext.Provider>
            </RuntimeContext.Provider>
        ),
        ...additionalProps
    });
}

afterEach(() => {
    __clearLocalModuleRegistry();
    __clearRemoteModuleRegistry();
    __clearAppReducerDispatchProxy();
});

test("when modules are registered but not ready, global data is ready and msw is ready, register the deferred registrations", async () => {
    const runtime = new FireflyRuntime();

    let dispatch: jest.Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = jest.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;
    state.isMswReady = true;

    const initialData = {
        foo: "bar"
    };

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, state, dispatch, initialData);

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "modules-ready" }));
});

test("when modules are ready, msw is ready, and the public data change, update the deferred registrations", async () => {
    const runtime = new FireflyRuntime();

    let dispatch: jest.Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = jest.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;
    state1.isMswReady = true;

    const initialData = {
        foo: "bar"
    };

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, state1, dispatch, initialData);

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "modules-ready" }));

    const state2 = createDefaultAppRouterState();
    state2.areModulesRegistered = true;
    state2.areModulesReady = true;
    state2.isPublicDataReady = true;
    state2.isProtectedDataReady = true;
    state2.isMswReady = true;
    state2.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state2.publicDataUpdatedAt = Date.parse("2020-03-14");

    const updatedData = {
        foo: "toto"
    };

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // Not using the "rerender" function from renderHook because the AppRouterStateProvider value must be updated. I can't find how to update the wrapper
    // props through a re-render.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, state2, dispatch, updatedData);

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "deferred-registrations-updated" }));
});

test("when modules are ready, msw is ready, and the protected data change, update the deferred registrations", async () => {
    const runtime = new FireflyRuntime();

    let dispatch: jest.Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = jest.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;
    state1.isMswReady = true;

    const initialData = {
        foo: "bar"
    };

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, state1, dispatch, initialData);

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "modules-ready" }));

    const state2 = createDefaultAppRouterState();
    state2.areModulesRegistered = true;
    state2.areModulesReady = true;
    state2.isPublicDataReady = true;
    state2.isProtectedDataReady = true;
    state2.isMswReady = true;
    state2.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state2.protectedDataUpdatedAt = Date.parse("2020-03-14");

    const updatedData = {
        foo: "toto"
    };

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // Not using the "rerender" function from renderHook because the AppRouterStateProvider value must be updated. I can't find how to update the wrapper
    // props through a re-render.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, state2, dispatch, updatedData);

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "deferred-registrations-updated" }));
});

test("when modules are not registered, do not register the deferred registrations", async () => {
    const runtime = new FireflyRuntime();

    let dispatch: jest.Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = jest.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = false;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;
    state.isMswReady = true;

    const initialData = {
        foo: "bar"
    };

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, state, dispatch, initialData);

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(dispatch).not.toHaveBeenCalledWith({ type: "modules-ready" });
});

test("when modules are ready, msw is ready, but the global data hasn't change, do not update the deferred registrations", async () => {
    const runtime = new FireflyRuntime();

    let dispatch: jest.Mock;

    const dispatchProxyFactory = (reactDispatch: AppRouterDispatch) => {
        act(() => {
            dispatch = jest.fn(value => reactDispatch(value));
        });

        return dispatch;
    };

    __setAppReducerDispatchProxyFactory(dispatchProxyFactory);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const data = {
        foo: "bar"
    };

    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;
    state1.isMswReady = true;

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, state1, dispatch, data);

    await waitFor(() => expect(dispatch).toHaveBeenLastCalledWith({ type: "modules-ready" }));

    const state2 = createDefaultAppRouterState();
    state2.areModulesRegistered = true;
    state2.areModulesReady = true;
    state2.isPublicDataReady = true;
    state2.isProtectedDataReady = true;
    state2.isMswReady = true;
    state2.deferredRegistrationsUpdatedAt = Date.parse("2020-03-14");
    state2.publicDataUpdatedAt = Date.parse("2020-02-14");
    state2.protectedDataUpdatedAt = Date.parse("2020-02-14");

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // Not using the "rerender" function from renderHook because the AppRouterStateProvider value must be updated. I can't find how to update the wrapper
    // props through a re-render.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    renderUseDeferredRegistrationsHook(runtime, state2, dispatch, data);

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    // Ignoring "dispatch is used before being assigned" because it will always being assigned through the dispatchProxyFactory function.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(dispatch).not.toHaveBeenCalledWith({ type: "deferred-registrations-updated" });
});

test("when an error occurs while registering the deferred registrations of the local modules, invoke the onError callback", async () => {
    const runtime = new FireflyRuntime();

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => jest.fn());

    const localModuleRegistry = new LocalModuleRegistry();

    const localModuleRegistrationError = {
        error: new Error("toto")
    } satisfies ModuleRegistrationError;

    jest.spyOn(localModuleRegistry, "registerDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            localModuleRegistrationError
        ]);
    });

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;
    state.isMswReady = true;

    const initialData = {
        foo: "bar"
    };

    const dispatch = jest.fn();
    const onError = jest.fn();

    renderUseDeferredRegistrationsHook(runtime, state, dispatch, initialData, onError);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
            localModuleErrors: expect.arrayContaining([localModuleRegistrationError])
        })
    ));
});

test("when an error occurs while registering the deferred registrations of the remote modules, invoke the onError callback", async () => {
    const runtime = new FireflyRuntime();

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => jest.fn());

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const remoteModuleRegistrationError = {
        remoteName: "foo",
        moduleName: "bar",
        error: new Error("toto")
    } satisfies RemoteModuleRegistrationError;

    jest.spyOn(remoteModuleRegistry, "registerDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            remoteModuleRegistrationError
        ]);
    });

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;
    state.isMswReady = true;

    const initialData = {
        foo: "bar"
    };

    const dispatch = jest.fn();
    const onError = jest.fn();

    renderUseDeferredRegistrationsHook(runtime, state, dispatch, initialData, onError);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
            remoteModuleErrors: expect.arrayContaining([remoteModuleRegistrationError])
        })
    ));
});

test("when an error occurs while registering the deferred registrations of the local & remote modules, invoke the onError callback", async () => {
    const runtime = new FireflyRuntime();

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => jest.fn());

    const localModuleRegistry = new LocalModuleRegistry();

    const localModuleRegistrationError = {
        error: new Error("toto")
    } satisfies ModuleRegistrationError;

    jest.spyOn(localModuleRegistry, "registerDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            localModuleRegistrationError
        ]);
    });

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const remoteModuleRegistrationError = {
        remoteName: "foo",
        moduleName: "bar",
        error: new Error("toto")
    } satisfies RemoteModuleRegistrationError;

    jest.spyOn(remoteModuleRegistry, "registerDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            remoteModuleRegistrationError
        ]);
    });

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.areModulesReady = false;
    state.isPublicDataReady = true;
    state.isProtectedDataReady = true;
    state.isMswReady = true;

    const initialData = {
        foo: "bar"
    };

    const dispatch = jest.fn();
    const onError = jest.fn();

    renderUseDeferredRegistrationsHook(runtime, state, dispatch, initialData, onError);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
            localModuleErrors: expect.arrayContaining([localModuleRegistrationError]),
            remoteModuleErrors: expect.arrayContaining([remoteModuleRegistrationError])
        })
    ));
});

test("when an error occurs while updating the deferred registrations of the local modules, invoke the onError callback", async () => {
    const runtime = new FireflyRuntime();

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => jest.fn());

    const localModuleRegistry = new LocalModuleRegistry();

    const localModuleRegistrationError = {
        error: new Error("toto")
    } satisfies ModuleRegistrationError;

    jest.spyOn(localModuleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            localModuleRegistrationError
        ]);
    });

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const dispatch = jest.fn();
    const onError = jest.fn();

    const initialData = {
        foo: "bar"
    };

    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;
    state1.isMswReady = true;

    renderUseDeferredRegistrationsHook(runtime, state1, dispatch, initialData);

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    expect(onError).not.toHaveBeenCalled();

    const state2 = createDefaultAppRouterState();
    state2.areModulesRegistered = true;
    state2.areModulesReady = true;
    state2.isPublicDataReady = true;
    state2.isProtectedDataReady = true;
    state2.isMswReady = true;
    state2.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state2.protectedDataUpdatedAt = Date.parse("2020-03-14");

    const updatedData = {
        foo: "toto"
    };

    // Not using the "rerender" function from renderHook because the AppRouterStateProvider value must be updated. I can't find how to update the wrapper
    // props through a re-render.
    renderUseDeferredRegistrationsHook(runtime, state2, dispatch, updatedData, onError);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
            localModuleErrors: expect.arrayContaining([localModuleRegistrationError])
        })
    ));
});

test("when an error occurs while updating the deferred registrations of the protected modules, invoke the onError callback", async () => {
    const runtime = new FireflyRuntime();

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => jest.fn());

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const remoteModuleRegistrationError = {
        remoteName: "foo",
        moduleName: "bar",
        error: new Error("toto")
    } satisfies RemoteModuleRegistrationError;

    jest.spyOn(remoteModuleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            remoteModuleRegistrationError
        ]);
    });

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const dispatch = jest.fn();
    const onError = jest.fn();

    const initialData = {
        foo: "bar"
    };

    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;
    state1.isMswReady = true;

    renderUseDeferredRegistrationsHook(runtime, state1, dispatch, initialData);

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    expect(onError).not.toHaveBeenCalled();

    const state2 = createDefaultAppRouterState();
    state2.areModulesRegistered = true;
    state2.areModulesReady = true;
    state2.isPublicDataReady = true;
    state2.isProtectedDataReady = true;
    state2.isMswReady = true;
    state2.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state2.protectedDataUpdatedAt = Date.parse("2020-03-14");

    const updatedData = {
        foo: "toto"
    };

    // Not using the "rerender" function from renderHook because the AppRouterStateProvider value must be updated. I can't find how to update the wrapper
    // props through a re-render.
    renderUseDeferredRegistrationsHook(runtime, state2, dispatch, updatedData, onError);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
            remoteModuleErrors: expect.arrayContaining([remoteModuleRegistrationError])
        })
    ));
});

test("when an error occurs while updating the deferred registrations of the local & protected modules, invoke the onError callback", async () => {
    const runtime = new FireflyRuntime();

    // Setting a dummy dispatch proxy to prevent: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"
    __setAppReducerDispatchProxyFactory(() => jest.fn());

    const localModuleRegistry = new LocalModuleRegistry();

    const localModuleRegistrationError = {
        error: new Error("toto")
    } satisfies ModuleRegistrationError;

    jest.spyOn(localModuleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            localModuleRegistrationError
        ]);
    });

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    const remoteModuleRegistrationError = {
        remoteName: "foo",
        moduleName: "bar",
        error: new Error("toto")
    } satisfies RemoteModuleRegistrationError;

    jest.spyOn(remoteModuleRegistry, "updateDeferredRegistrations").mockImplementation(() => {
        return Promise.resolve([
            remoteModuleRegistrationError
        ]);
    });

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    renderUseAppReducerHook(runtime);

    await registerLocalModules([
        () => () => {}
    ], runtime);

    await registerRemoteModules([
        { name: "Dummy-1" },
        { name: "Dummy-2" }
    ], runtime);

    const dispatch = jest.fn();
    const onError = jest.fn();

    const initialData = {
        foo: "bar"
    };

    const state1 = createDefaultAppRouterState();
    state1.areModulesRegistered = true;
    state1.areModulesReady = false;
    state1.isPublicDataReady = true;
    state1.isProtectedDataReady = true;
    state1.isMswReady = true;

    renderUseDeferredRegistrationsHook(runtime, state1, dispatch, initialData);

    // Since the hooks cannot be awaited and there's a delay between the hook are rendered and the actions are dispatched, it's safer
    // to wait for a little while before asserting.
    // Not ideal thought, might be something to improve later on.
    await sleep(50);

    expect(onError).not.toHaveBeenCalled();

    const state2 = createDefaultAppRouterState();
    state2.areModulesRegistered = true;
    state2.areModulesReady = true;
    state2.isPublicDataReady = true;
    state2.isProtectedDataReady = true;
    state2.isMswReady = true;
    state2.deferredRegistrationsUpdatedAt = Date.parse("2020-02-14");
    state2.protectedDataUpdatedAt = Date.parse("2020-03-14");

    const updatedData = {
        foo: "toto"
    };

    // Not using the "rerender" function from renderHook because the AppRouterStateProvider value must be updated. I can't find how to update the wrapper
    // props through a re-render.
    renderUseDeferredRegistrationsHook(runtime, state2, dispatch, updatedData, onError);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
            localModuleErrors: expect.arrayContaining([localModuleRegistrationError]),
            remoteModuleErrors: expect.arrayContaining([remoteModuleRegistrationError])
        })
    ));
});


