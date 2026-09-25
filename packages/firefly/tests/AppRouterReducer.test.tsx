import { ModuleManager, Plugin, type ModuleRegistrationError, type ModuleRegistrationStatus, type ModuleRegistrationStatusChangedListener, type ModuleRegistry, type PluginReadyListener, type Runtime } from "@squide/core";
import { InMemoryLaunchDarklyClient, LaunchDarklyClientNotifier, LaunchDarklyPlugin } from "@squide/launch-darkly";
import { MswPlugin, type MswReadyListener } from "@squide/msw";
import { MswState } from "@squide/msw/internal";
import { act, renderHook, type RenderHookOptions } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import type { ReactNode } from "react";
import { describe, test, vi } from "vitest";
import {
    ActiveRouteIsProtectedEvent,
    ActiveRouteIsPublicEvent,
    ModulesReadyEvent,
    ModulesRegisteredEvent,
    MswReadyEvent,
    PluginsReadyEvent,
    ProtectedDataReadyEvent,
    PublicDataReadyEvent,
    useAppRouterReducer,
    useFeatureFlagsUpdatedDispatcher,
    useModuleRegistrationStatusDispatcher,
    useMswStatusDispatcher,
    usePluginsReadinessDispatcher,
    type AppRouterDispatch
} from "../src/AppRouterReducer.ts";
import { FireflyProvider } from "../src/FireflyProvider.tsx";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";

class DummyModuleRegistry implements ModuleRegistry {
    readonly #registryId: string;
    readonly #registrationStatus: ModuleRegistrationStatus;
    readonly #statusChangedListeners = new Set<ModuleRegistrationStatusChangedListener>();

    constructor(registryId: string, registrationStatus: ModuleRegistrationStatus) {
        this.#registryId = registryId;
        this.#registrationStatus = registrationStatus;
    }

    get id() {
        return this.#registryId;
    }

    registerModules(): Promise<ModuleRegistrationError[]> {
        throw new Error("Method not implemented.");
    }

    registerDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
        throw new Error("Method not implemented.");
    }

    updateDeferredRegistrations(): Promise<ModuleRegistrationError[]> {
        throw new Error("Method not implemented.");
    }

    registerStatusChangedListener(callback: ModuleRegistrationStatusChangedListener) {
        this.#statusChangedListeners.add(callback);
    }

    removeStatusChangedListener(callback: ModuleRegistrationStatusChangedListener) {
        this.#statusChangedListeners.delete(callback);
    }

    setAsReady(): void {
        throw new Error("Method not implemented.");
    }

    get registrationStatus(): ModuleRegistrationStatus {
        return this.#registrationStatus;
    }

    invokeEventListeners() {
        this.#statusChangedListeners.forEach(x => {
            x();
        });
    }
}

class DummyMswState extends MswState {
    #isReady = false;

    readonly #stateChangedListeners = new Set<MswReadyListener>();

    constructor(isReady: boolean) {
        super();

        this.#isReady = isReady;
    }

    addMswReadyListener(callback: MswReadyListener) {
        this.#stateChangedListeners.add(callback);
    }

    removeMswReadyListener(callback: MswReadyListener) {
        this.#stateChangedListeners.delete(callback);
    }

    notifyEventListeners() {
        this.#stateChangedListeners.forEach(x => {
            x();
        });
    }

    get isReady() {
        return this.#isReady;
    }
}

// A plugin implementing the readiness surface with a latch that tests can flip.
class DummyReadyPlugin extends Plugin {
    #isReady: boolean;

    readonly #readyListeners = new Set<PluginReadyListener>();

    constructor(runtime: Runtime, isReady = false, name = "dummy-ready-plugin") {
        super(name, runtime);

        this.#isReady = isReady;
    }

    isReady() {
        return this.#isReady;
    }

    registerReadyListener(callback: PluginReadyListener) {
        this.#readyListeners.add(callback);
    }

    removeReadyListener(callback: PluginReadyListener) {
        this.#readyListeners.delete(callback);
    }

    setAsReady() {
        if (!this.#isReady) {
            this.#isReady = true;

            this.#readyListeners.forEach(x => {
                x();
            });
        }
    }

    get readyListenersCount() {
        return this.#readyListeners.size;
    }
}

// A plugin without the readiness surface, always considered ready.
class DummyPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super("dummy-plugin", runtime);
    }
}

describe.concurrent("useAppRouterReducer", () => {
    function renderUseAppRouterReducerHook<TProps>(runtime: FireflyRuntime, waitForPublicData: boolean, waitForProtectedData: boolean, additionalProps: RenderHookOptions<TProps> = {}) {
        return renderHook(() => useAppRouterReducer(waitForPublicData, waitForProtectedData), {
            wrapper: ({ children }: { children?: ReactNode }) => (
                <FireflyProvider runtime={runtime}>
                    {children}
                </FireflyProvider>
            ),
            ...additionalProps
        });
    }

    test.concurrent("the reducer is initialized with the provided values for \"waitForMsw\", \"waitForPublicData\" and \"waitForProtectedData\" 1", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x)],
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, true, true);

        const [state] = result.current;

        expect(state.waitForMsw).toBeTruthy();
        expect(state.waitForPublicData).toBeTruthy();
        expect(state.waitForProtectedData).toBeTruthy();
    });

    test.concurrent("the reducer is initialized with the provided values for \"waitForMsw\", \"waitForPublicData\" and \"waitForProtectedData\" 2", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        const [state] = result.current;

        expect(state.waitForMsw).toBeFalsy();
        expect(state.waitForPublicData).toBeFalsy();
        expect(state.waitForProtectedData).toBeFalsy();
    });

    test.concurrent("when \"modules-registered\" is dispatched, \"areModulesRegistered\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "modules-registered" });
        });

        expect(result.current[0].areModulesRegistered).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeTruthy();
    });

    test.concurrent("when \"modules-registered\" is dispatched, ModulesRegisteredEvent is dispatched", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "modules-registered" });
        });

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"modules-ready\" is dispatched, \"areModulesReady\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "modules-ready" });
        });

        expect(result.current[0].areModulesReady).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeTruthy();
    });

    test.concurrent("when \"modules-ready\" is dispatched, ModulesReadyEvent is dispatched", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesReadyEvent, listener);

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "modules-ready" });
        });

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"modules-ready\" is dispatched, \"deferredRegistrationsUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"));

        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].deferredRegistrationsUpdatedAt).toBeUndefined();
        expect(runtime.appRouterStore.state.deferredRegistrationsUpdatedAt).toBeUndefined();

        act(() => {
            // dispatch
            result.current[1]({ type: "modules-ready" });
        });

        expect(result.current[0].deferredRegistrationsUpdatedAt).toEqual(Date.parse("2020-02-14"));
        expect(runtime.appRouterStore.state.deferredRegistrationsUpdatedAt).toEqual(Date.parse("2020-02-14"));
    });

    test.concurrent("when \"msw-ready\" is dispatched, \"isMswReady\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x)],
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].isMswReady).toBeFalsy();
        expect(runtime.appRouterStore.state.isMswReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "msw-ready" });
        });

        expect(result.current[0].isMswReady).toBeTruthy();
        expect(runtime.appRouterStore.state.isMswReady).toBeTruthy();
    });

    test.concurrent("when \"msw-ready\" is dispatched, MswReadyEvent is dispatched", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x)],
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(MswReadyEvent, listener);

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].isMswReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "msw-ready" });
        });

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: true, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"plugins-ready\" is dispatched, \"arePluginsReady\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new DummyReadyPlugin(x)],
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].arePluginsReady).toBeFalsy();
        expect(runtime.appRouterStore.state.arePluginsReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "plugins-ready" });
        });

        expect(result.current[0].arePluginsReady).toBeTruthy();
        expect(runtime.appRouterStore.state.arePluginsReady).toBeTruthy();
    });

    test.concurrent("when \"plugins-ready\" is dispatched, PluginsReadyEvent is dispatched", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new DummyReadyPlugin(x)],
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(PluginsReadyEvent, listener);

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].arePluginsReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "plugins-ready" });
        });

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when the last plugin becomes ready after the initialization, \"arePluginsReady\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [
                x => new DummyReadyPlugin(x, false, "plugin-1"),
                x => new DummyReadyPlugin(x, false, "plugin-2")
            ],
            loggers: [new NoopLogger()]
        });

        const plugin1 = runtime.getPlugin("plugin-1") as DummyReadyPlugin;
        const plugin2 = runtime.getPlugin("plugin-2") as DummyReadyPlugin;

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].arePluginsReady).toBeFalsy();

        act(() => {
            plugin1.setAsReady();
        });

        expect(result.current[0].arePluginsReady).toBeFalsy();
        expect(runtime.appRouterStore.state.arePluginsReady).toBeFalsy();

        act(() => {
            plugin2.setAsReady();
        });

        expect(result.current[0].arePluginsReady).toBeTruthy();
        expect(runtime.appRouterStore.state.arePluginsReady).toBeTruthy();
    });

    test.concurrent("when \"public-data-ready\" is dispatched, \"isPublicDataReady\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, true, false);

        expect(result.current[0].isPublicDataReady).toBeFalsy();
        expect(runtime.appRouterStore.state.isPublicDataReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "public-data-ready" });
        });

        expect(result.current[0].isPublicDataReady).toBeTruthy();
        expect(runtime.appRouterStore.state.isPublicDataReady).toBeTruthy();
    });

    test.concurrent("when \"public-data-ready\" is dispatched, PublicDataReadyEvent is dispatched", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(PublicDataReadyEvent, listener);

        const { result } = renderUseAppRouterReducerHook(runtime, true, false);

        expect(result.current[0].isPublicDataReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "public-data-ready" });
        });

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: true, waitForProtectedData: false });
    });

    test.concurrent("when \"public-data-ready\" is dispatched, \"publicDataUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"));

        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, true, false);

        expect(result.current[0].publicDataUpdatedAt).toBeUndefined();
        expect(runtime.appRouterStore.state.publicDataUpdatedAt).toBeUndefined();

        act(() => {
            // dispatch
            result.current[1]({ type: "public-data-ready" });
        });

        expect(result.current[0].publicDataUpdatedAt).toEqual(Date.parse("2020-02-14"));
        expect(runtime.appRouterStore.state.publicDataUpdatedAt).toEqual(Date.parse("2020-02-14"));
    });

    test.concurrent("when \"protected-data-ready\" is dispatched, \"isProtectedDataReady\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, true);

        expect(result.current[0].isProtectedDataReady).toBeFalsy();
        expect(runtime.appRouterStore.state.isProtectedDataReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "protected-data-ready" });
        });

        expect(result.current[0].isProtectedDataReady).toBeTruthy();
        expect(runtime.appRouterStore.state.isProtectedDataReady).toBeTruthy();
    });

    test.concurrent("when \"protected-data-ready\" is dispatched, ProtectedDataReadyEvent is dispatched", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ProtectedDataReadyEvent, listener);

        const { result } = renderUseAppRouterReducerHook(runtime, false, true);

        expect(result.current[0].isProtectedDataReady).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "protected-data-ready" });
        });

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: true });
    });

    test.concurrent("when \"protected-data-ready\" is dispatched, \"protectedDataUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"));

        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, true);

        expect(result.current[0].protectedDataUpdatedAt).toBeUndefined();
        expect(runtime.appRouterStore.state.protectedDataUpdatedAt).toBeUndefined();

        act(() => {
            // dispatch
            result.current[1]({ type: "protected-data-ready" });
        });

        expect(result.current[0].protectedDataUpdatedAt).toEqual(Date.parse("2020-02-14"));
        expect(runtime.appRouterStore.state.protectedDataUpdatedAt).toEqual(Date.parse("2020-02-14"));
    });

    test.concurrent("when \"public-data-updated\" is dispatched, \"publicDataUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2021-02-14"))
            .mockImplementationOnce(() => Date.parse("2021-02-14"));

        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        act(() => {
            // dispatch
            result.current[1]({ type: "public-data-ready" });
        });

        expect(result.current[0].publicDataUpdatedAt).toEqual(Date.parse("2020-02-14"));
        expect(runtime.appRouterStore.state.publicDataUpdatedAt).toEqual(Date.parse("2020-02-14"));

        act(() => {
            // dispatch
            result.current[1]({ type: "public-data-updated" });
        });

        expect(result.current[0].publicDataUpdatedAt).toEqual(Date.parse("2021-02-14"));
        expect(runtime.appRouterStore.state.publicDataUpdatedAt).toEqual(Date.parse("2021-02-14"));
    });

    test.concurrent("when \"protected-data-updated\" is dispatched, \"protectedDataUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2021-02-14"))
            .mockImplementationOnce(() => Date.parse("2021-02-14"));

        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        act(() => {
            // dispatch
            result.current[1]({ type: "protected-data-ready" });
        });

        expect(result.current[0].protectedDataUpdatedAt).toEqual(Date.parse("2020-02-14"));
        expect(runtime.appRouterStore.state.protectedDataUpdatedAt).toEqual(Date.parse("2020-02-14"));

        act(() => {
            // dispatch
            result.current[1]({ type: "protected-data-updated" });
        });

        expect(result.current[0].protectedDataUpdatedAt).toEqual(Date.parse("2021-02-14"));
        expect(runtime.appRouterStore.state.protectedDataUpdatedAt).toEqual(Date.parse("2021-02-14"));
    });

    test.concurrent("when \"feature-flags-updated\" is dispatched, \"featureFlagsUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2021-02-14"))
            .mockImplementationOnce(() => Date.parse("2021-02-14"));

        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        act(() => {
            // dispatch
            result.current[1]({ type: "feature-flags-updated" });
        });

        expect(result.current[0].featureFlagsUpdatedAt).toEqual(Date.parse("2020-02-14"));
        expect(runtime.appRouterStore.state.featureFlagsUpdatedAt).toEqual(Date.parse("2020-02-14"));

        act(() => {
            // dispatch
            result.current[1]({ type: "feature-flags-updated" });
        });

        expect(result.current[0].featureFlagsUpdatedAt).toEqual(Date.parse("2021-02-14"));
        expect(runtime.appRouterStore.state.featureFlagsUpdatedAt).toEqual(Date.parse("2021-02-14"));
    });

    test.concurrent("when \"deferred-registrations-updated\" is dispatched, \"deferredRegistrationsUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"));

        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].deferredRegistrationsUpdatedAt).toBeUndefined();
        expect(runtime.appRouterStore.state.deferredRegistrationsUpdatedAt).toBeUndefined();

        act(() => {
            // dispatch
            result.current[1]({ type: "deferred-registrations-updated" });
        });

        expect(result.current[0].deferredRegistrationsUpdatedAt).toEqual(Date.parse("2020-02-14"));
        expect(runtime.appRouterStore.state.deferredRegistrationsUpdatedAt).toEqual(Date.parse("2020-02-14"));
    });

    test.concurrent("when \"active-route-is-public\" is dispatched, \"activeRouteVisiblity\" is \"public\"", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].activeRouteVisibility).toBe("unknown");
        expect(runtime.appRouterStore.state.activeRouteVisibility).toBe("unknown");

        act(() => {
            // dispatch
            result.current[1]({ type: "active-route-is-public" });
        });

        expect(result.current[0].activeRouteVisibility).toBe("public");
        expect(runtime.appRouterStore.state.activeRouteVisibility).toBe("public");
    });

    test.concurrent("when \"active-route-is-public\" is dispatched, ActiveRouteIsPublicEvent is dispatched", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ActiveRouteIsPublicEvent, listener);

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].activeRouteVisibility).toBe("unknown");

        act(() => {
            // dispatch
            result.current[1]({ type: "active-route-is-public" });
        });

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"active-route-is-protected\" is dispatched, \"activeRouteVisiblity\" is \"protected\"", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].activeRouteVisibility).toBe("unknown");
        expect(runtime.appRouterStore.state.activeRouteVisibility).toBe("unknown");

        act(() => {
            // dispatch
            result.current[1]({ type: "active-route-is-protected" });
        });

        expect(result.current[0].activeRouteVisibility).toBe("protected");
        expect(runtime.appRouterStore.state.activeRouteVisibility).toBe("protected");
    });

    test.concurrent("when \"active-route-is-protected\" is dispatched, ActiveRouteIsProtectedEvent is dispatched", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ActiveRouteIsProtectedEvent, listener);

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].activeRouteVisibility).toBe("unknown");

        act(() => {
            // dispatch
            result.current[1]({ type: "active-route-is-protected" });
        });

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"is-unauthorized\" is dispatched, \"isUnauthorized\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].isUnauthorized).toBeFalsy();
        expect(runtime.appRouterStore.state.isUnauthorized).toBeFalsy();

        act(() => {
            // dispatch
            result.current[1]({ type: "is-unauthorized" });
        });

        expect(result.current[0].isUnauthorized).toBeTruthy();
        expect(runtime.appRouterStore.state.isUnauthorized).toBeTruthy();
    });

    test.concurrent("when all registries modules are registered, \"areModulesRegistered\" is true at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeTruthy();
    });

    test.concurrent("when all registries modules are registered, ModulesRegisteredEvent is dispatched at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when local modules are registered and no remote modules has been provided, \"areModulesRegistered\" is true at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "none");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeTruthy();
    });

    test.concurrent("when local modules are registered and no remote modules has been provided, ModulesRegisteredEvent is dispatched at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "none");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when no local modules has been provided and remote modules are registered, \"areModulesRegistered\" is true at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "none");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeTruthy();
    });

    test.concurrent("when no local modules are registered and remote modules are registered, ModulesRegisteredEvent is dispatched at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "none");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when local modules are registered and remote modules are registering, \"areModulesRegistered\" is false at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "registering-modules");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeFalsy();
    });

    test.concurrent("when local modules are registering and remote modules are registered, \"areModulesRegistered\" is false at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "registering-modules");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeFalsy();
    });

    test.concurrent("when all registries modules are ready, \"areModulesReady\" is true at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "ready");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "ready");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeTruthy();
    });

    test.concurrent("when all registries modules are ready, ModulesReadyEvent is dispatched at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "ready");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "ready");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when local modules are ready and no remote modules has been provided, \"areModulesReady\" is true at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "ready");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "none");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeTruthy();
    });

    test.concurrent("when local modules are ready and no remote modules has been provided, ModulesReadyEvent is dispatched at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "ready");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "none");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when no local modules has been provided and remote modules are ready, \"areModulesReady\" is true at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "none");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "ready");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeTruthy();
    });

    test.concurrent("when no local modules has been provided and remote modules are ready, ModulesReadyEvent is dispatched at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "none");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "ready");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when local modules are ready and remote modules are not ready, \"areModulesReady\" is false at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "ready");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeFalsy();
    });

    test.concurrent("when local modules are not ready and remote modules are ready, \"areModulesReady\" is false at initialization", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "ready");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeFalsy();
    });

    test.concurrent("when msw is ready, \"isMswReady\" is true at initialization", ({ expect }) => {
        const mswState = new DummyMswState(true);

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, {
                state: mswState
            })],
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].isMswReady).toBeTruthy();
        expect(runtime.appRouterStore.state.isMswReady).toBeTruthy();
    });

    test.concurrent("when msw is ready, MswReadyEvent is dispatched at initialization", ({ expect }) => {
        const mswState = new DummyMswState(true);

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, {
                state: mswState
            })],
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(MswReadyEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: true, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when msw is not ready, \"isMswReady\" is false at initialization", ({ expect }) => {
        const mswState = new DummyMswState(false);

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, {
                state: mswState
            })],
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].isMswReady).toBeFalsy();
        expect(runtime.appRouterStore.state.isMswReady).toBeFalsy();
    });

    test.concurrent("when no plugin implements the readiness surface, \"arePluginsReady\" is true at initialization", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new DummyPlugin(x)],
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].arePluginsReady).toBeTruthy();
    });

    test.concurrent("when no plugin implements the readiness surface, PluginsReadyEvent is not dispatched at initialization", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new DummyPlugin(x)],
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(PluginsReadyEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).not.toHaveBeenCalled();
        expect(runtime.appRouterStore.state.arePluginsReady).toBeFalsy();
    });

    test.concurrent("when every readiness-aware plugin is ready, \"arePluginsReady\" is true at initialization", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [
                x => new DummyPlugin(x),
                x => new DummyReadyPlugin(x, true, "plugin-1"),
                x => new DummyReadyPlugin(x, true, "plugin-2")
            ],
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].arePluginsReady).toBeTruthy();
        expect(runtime.appRouterStore.state.arePluginsReady).toBeTruthy();
    });

    test.concurrent("when every readiness-aware plugin is ready, PluginsReadyEvent is dispatched at initialization", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new DummyReadyPlugin(x, true)],
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(PluginsReadyEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledExactlyOnceWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when a readiness-aware plugin is not ready, \"arePluginsReady\" is false at initialization", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [
                x => new DummyReadyPlugin(x, true, "plugin-1"),
                x => new DummyReadyPlugin(x, false, "plugin-2")
            ],
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(PluginsReadyEvent, listener);

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].arePluginsReady).toBeFalsy();
        expect(runtime.appRouterStore.state.arePluginsReady).toBeFalsy();
        expect(listener).not.toHaveBeenCalled();
    });
});

describe.concurrent("useModuleRegistrationStatusDispatcher", () => {
    function renderUseModuleRegistrationStatusDispatcherHook<TProps>(runtime: FireflyRuntime, areModulesRegistered: boolean, areModulesReady: boolean, dispatch: AppRouterDispatch, additionalProps: RenderHookOptions<TProps> = {}) {
        return renderHook(() => useModuleRegistrationStatusDispatcher(runtime, areModulesRegistered, areModulesReady, dispatch), {
            wrapper: ({ children }: { children?: ReactNode }) => (
                <FireflyProvider runtime={runtime}>
                    {children}
                </FireflyProvider>
            ),
            ...additionalProps
        });
    }

    test.concurrent("when registries modules are not registered, do not dispatch the \"modules-registered\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "registering-modules");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "registering-modules");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, false, false, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });

    test.concurrent("when local modules are registered but remote modules are not registered, do not dispatch the \"modules-registered\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "registering-modules");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, false, false, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });

    test.concurrent("when local modules are not registered but remote modules are registered, do not dispatch the \"modules-registered\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "registering-modules");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, false, false, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });

    test.concurrent("when registries modules are registered, dispatch the \"modules-registered\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, false, false, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: "modules-registered" });
    });

    test.concurrent("when local modules and remote modules are registered and \"areModulesRegistered\" is already true, do not dispatch the \"modules-registered\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, true, false, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });

    test.concurrent("when local modules and remote modules are not ready, do not dispatch the \"modules-ready\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, true, false, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });

    test.concurrent("when local modules are ready but remote modules are not ready, do not dispatch the \"modules-ready\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "ready");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "modules-registered");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, true, false, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });

    test.concurrent("when local modules are not ready but remote modules are ready, do not dispatch the \"modules-ready\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "ready");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, true, false, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });

    test.concurrent("when registries modules are ready, dispatch the \"modules-ready\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "ready");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "ready");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, true, false, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: "modules-ready" });
    });

    test.concurrent("when registries modules are ready and \"areModulesReady\" is already true, do not dispatch the \"modules-ready\" action", ({ expect }) => {
        const localModuleRegistry = new DummyModuleRegistry("local", "ready");
        const remoteModuleRegistry = new DummyModuleRegistry("remote", "ready");

        const runtime = new FireflyRuntime({
            moduleManager: x => new ModuleManager(x, [
                localModuleRegistry,
                remoteModuleRegistry
            ]),
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseModuleRegistrationStatusDispatcherHook(runtime, true, true, dispatch);

        localModuleRegistry.invokeEventListeners();
        remoteModuleRegistry.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });
});

describe.concurrent("useMswStatusDispatcher", () => {
    function renderUseMswStatusDispatcherHook<TProps>(runtime: FireflyRuntime, isMswReady: boolean, dispatch: AppRouterDispatch, additionalProps: RenderHookOptions<TProps> = {}) {
        return renderHook(() => useMswStatusDispatcher(runtime, isMswReady, dispatch), {
            wrapper: ({ children }: { children?: ReactNode }) => (
                <FireflyProvider runtime={runtime}>
                    {children}
                </FireflyProvider>
            ),
            ...additionalProps
        });
    }

    test.concurrent("when msw is ready, dispatch the \"msw-ready\" action", ({ expect }) => {
        const mswState = new DummyMswState(true);

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, {
                state: mswState
            })],
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseMswStatusDispatcherHook(runtime, false, dispatch);

        mswState.notifyEventListeners();

        expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: "msw-ready" });
    });

    test.concurrent("when msw is ready and \"isMswReady\" is already true, do not dispatch the \"msw-ready\" action", ({ expect }) => {
        const mswState = new DummyMswState(true);

        const runtime = new FireflyRuntime({
            plugins: [x => new MswPlugin(x, {
                state: mswState
            })],
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseMswStatusDispatcherHook(runtime, true, dispatch);

        mswState.notifyEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });
});

describe.concurrent("usePluginsReadinessDispatcher", () => {
    function renderUsePluginsReadinessDispatcherHook<TProps>(runtime: FireflyRuntime, arePluginsReady: boolean, dispatch: AppRouterDispatch, additionalProps: RenderHookOptions<TProps> = {}) {
        return renderHook(() => usePluginsReadinessDispatcher(runtime, arePluginsReady, dispatch), {
            wrapper: ({ children }: { children?: ReactNode }) => (
                <FireflyProvider runtime={runtime}>
                    {children}
                </FireflyProvider>
            ),
            ...additionalProps
        });
    }

    test.concurrent("when the last not ready plugin becomes ready, dispatch the \"plugins-ready\" action once", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [
                x => new DummyPlugin(x),
                x => new DummyReadyPlugin(x, false, "plugin-1"),
                x => new DummyReadyPlugin(x, false, "plugin-2")
            ],
            loggers: [new NoopLogger()]
        });

        const plugin1 = runtime.getPlugin("plugin-1") as DummyReadyPlugin;
        const plugin2 = runtime.getPlugin("plugin-2") as DummyReadyPlugin;

        const dispatch = vi.fn();

        renderUsePluginsReadinessDispatcherHook(runtime, false, dispatch);

        plugin1.setAsReady();

        expect(dispatch).not.toHaveBeenCalled();

        plugin2.setAsReady();

        expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: "plugins-ready" });
    });

    test.concurrent("when a plugin is already ready at subscription, only the not ready plugins are subscribed", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [
                x => new DummyReadyPlugin(x, true, "plugin-1"),
                x => new DummyReadyPlugin(x, false, "plugin-2")
            ],
            loggers: [new NoopLogger()]
        });

        const readyPlugin = runtime.getPlugin("plugin-1") as DummyReadyPlugin;
        const notReadyPlugin = runtime.getPlugin("plugin-2") as DummyReadyPlugin;

        renderUsePluginsReadinessDispatcherHook(runtime, false, vi.fn());

        expect(readyPlugin.readyListenersCount).toBe(0);
        expect(notReadyPlugin.readyListenersCount).toBe(1);
    });

    test.concurrent("when \"arePluginsReady\" is already true, do not subscribe nor dispatch the \"plugins-ready\" action", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new DummyReadyPlugin(x, false)],
            loggers: [new NoopLogger()]
        });

        const plugin = runtime.getPlugin("dummy-ready-plugin") as DummyReadyPlugin;

        const dispatch = vi.fn();

        renderUsePluginsReadinessDispatcherHook(runtime, true, dispatch);

        expect(plugin.readyListenersCount).toBe(0);

        plugin.setAsReady();

        expect(dispatch).not.toHaveBeenCalled();
    });

    test.concurrent("when the plugins became ready before the subscription, dispatch the \"plugins-ready\" action", ({ expect }) => {
        // The plugin is ready but the reducer state still says otherwise, which happens when the latch flips between
        // the reducer initialization and the dispatcher effect.
        const runtime = new FireflyRuntime({
            plugins: [x => new DummyReadyPlugin(x, true)],
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUsePluginsReadinessDispatcherHook(runtime, false, dispatch);

        expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: "plugins-ready" });
    });

    test.concurrent("when the hook is unmounted, the ready listeners are removed", ({ expect }) => {
        const runtime = new FireflyRuntime({
            plugins: [x => new DummyReadyPlugin(x, false)],
            loggers: [new NoopLogger()]
        });

        const plugin = runtime.getPlugin("dummy-ready-plugin") as DummyReadyPlugin;

        const dispatch = vi.fn();

        const { unmount } = renderUsePluginsReadinessDispatcherHook(runtime, false, dispatch);

        expect(plugin.readyListenersCount).toBe(1);

        unmount();

        expect(plugin.readyListenersCount).toBe(0);

        plugin.setAsReady();

        expect(dispatch).not.toHaveBeenCalled();
    });
});

describe.concurrent("useFeatureFlagsUpdatedDispatcher", () => {
    function renderUseFeatureFlagsUpdatedDispatcherHook<TProps>(runtime: FireflyRuntime, dispatch: AppRouterDispatch, additionalProps: RenderHookOptions<TProps> = {}) {
        return renderHook(() => useFeatureFlagsUpdatedDispatcher(runtime, dispatch), {
            wrapper: ({ children }: { children?: ReactNode }) => (
                <FireflyProvider runtime={runtime}>
                    {children}
                </FireflyProvider>
            ),
            ...additionalProps
        });
    }

    test.concurrent("when the feature flags is updated, dispatch the \"feature-flags-updated\" action", ({ expect }) => {
        const featureFlags = new Map(Object.entries({
            "flag-a": true
        }));

        const notifier = new LaunchDarklyClientNotifier();

        const launchDarlyClient = new InMemoryLaunchDarklyClient(featureFlags, {
            notifier
        });

        const runtime = new FireflyRuntime({
            plugins: [x => new LaunchDarklyPlugin(x, launchDarlyClient)],
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        renderUseFeatureFlagsUpdatedDispatcherHook(runtime, dispatch);

        featureFlags.set("flag-a", false);

        notifier.notify("change", {
            "flag-a": true
        });

        expect(dispatch).toHaveBeenCalledOnce();
    });
});
