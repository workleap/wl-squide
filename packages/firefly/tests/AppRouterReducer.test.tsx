import { type ModuleRegistrationError, type ModuleRegistrationStatus, type ModuleRegistrationStatusChangedListener, type ModuleRegistry, type Runtime } from "@squide/core";
import { __clearRemoteModuleRegistry, __setRemoteModuleRegistry } from "@squide/module-federation";
import { __clearMswState, __setMswState, MswState, type MswStateChangedListener } from "@squide/msw";
import { act, renderHook, type RenderHookOptions } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import type { ReactNode } from "react";
import { afterEach, describe, test, vi } from "vitest";
import {
    ActiveRouteIsProtectedEvent,
    ActiveRouteIsPublicEvent,
    ModulesReadyEvent,
    ModulesRegisteredEvent,
    MswReadyEvent,
    ProtectedDataReadyEvent,
    PublicDataReadyEvent,
    useAppRouterReducer,
    // useModuleRegistrationStatusDispatcher,
    useMswStatusDispatcher,
    type AppRouterDispatch
} from "../src/AppRouterReducer.ts";
import { FireflyProvider } from "../src/FireflyProvider.tsx";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";

class DummyModuleRegistry implements ModuleRegistry {
    readonly #registrationStatus: ModuleRegistrationStatus;
    readonly #statusChangedListeners = new Set<ModuleRegistrationStatusChangedListener>();

    constructor(registrationStatus: ModuleRegistrationStatus) {
        this.#registrationStatus = registrationStatus;
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

    readonly #stateChangedListeners = new Set<MswStateChangedListener>();

    constructor(isReady: boolean) {
        super();

        this.#isReady = isReady;
    }

    addStateChangedListener(callback: MswStateChangedListener) {
        this.#stateChangedListeners.add(callback);
    }

    removeStateChangedListener(callback: MswStateChangedListener) {
        this.#stateChangedListeners.delete(callback);
    }

    invokeEventListeners() {
        this.#stateChangedListeners.forEach(x => {
            x();
        });
    }

    get isReady() {
        return this.#isReady;
    }
}

afterEach(() => {
    // __clearLocalModuleRegistry();
    __clearRemoteModuleRegistry();
    __clearMswState();
});

describe("useAppRouterReducer", () => {
    function renderUseAppRouterReducerHook<TProps>(runtime: Runtime, waitForPublicData: boolean, waitForProtectedData: boolean, additionalProps: RenderHookOptions<TProps> = {}) {
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
            useMsw: true,
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
            useMsw: false,
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
            useMsw: false,
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
            useMsw: false,
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

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"modules-ready\" is dispatched, \"areModulesReady\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            useMsw: false,
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
            useMsw: false,
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

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"modules-ready\" is dispatched, \"deferredRegistrationsUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"));

        const runtime = new FireflyRuntime({
            useMsw: false,
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
            useMsw: true,
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
            useMsw: true,
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

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: true, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"public-data-ready\" is dispatched, \"isPublicDataReady\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            useMsw: false,
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
            useMsw: false,
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

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: true, waitForProtectedData: false });
    });

    test.concurrent("when \"public-data-ready\" is dispatched, \"publicDataUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"));

        const runtime = new FireflyRuntime({
            useMsw: false,
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
            useMsw: false,
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
            useMsw: false,
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

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: true });
    });

    test.concurrent("when \"protected-data-ready\" is dispatched, \"protectedDataUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"));

        const runtime = new FireflyRuntime({
            useMsw: false,
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
            useMsw: false,
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
            useMsw: false,
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

    test.concurrent("when \"deferred-registrations-updated\" is dispatched, \"deferredRegistrationsUpdatedAt\" is set to the current timestamp", ({ expect }) => {
        vi.spyOn(global.Date, "now")
            .mockImplementationOnce(() => Date.parse("2020-02-14"))
            .mockImplementationOnce(() => Date.parse("2020-02-14"));

        const runtime = new FireflyRuntime({
            useMsw: false,
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
            useMsw: false,
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
            useMsw: false,
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

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"active-route-is-protected\" is dispatched, \"activeRouteVisiblity\" is \"protected\"", ({ expect }) => {
        const runtime = new FireflyRuntime({
            useMsw: false,
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
            useMsw: false,
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

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when \"is-unauthorized\" is dispatched, \"isUnauthorized\" is true", ({ expect }) => {
        const runtime = new FireflyRuntime({
            useMsw: false,
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

    test.concurrent("when local modules and remote modules are registered, \"areModulesRegistered\" is true at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("modules-registered"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeTruthy();
    });

    test.concurrent("when local modules and remote modules are registered, ModulesRegisteredEvent is dispatched at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("modules-registered"),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when local modules are registered and no remote modules has been provided, \"areModulesRegistered\" is true at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("none");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("modules-registered"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeTruthy();
    });

    test.concurrent("when local modules are registered and no remote modules has been provided, ModulesRegisteredEvent is dispatched at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("none");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("modules-registered"),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when no local modules has been provided and remote modules are registered, \"areModulesRegistered\" is true at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("none");
        const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("none"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeTruthy();
    });

    test.concurrent("when no local modules are registered and remote modules are registered, ModulesRegisteredEvent is dispatched at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("none");
        const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("none"),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when local modules are registered and remote modules are registering, \"areModulesRegistered\" is false at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("registering-modules");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("modules-registered"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeFalsy();
    });

    test.concurrent("when local modules are registering and remote modules are registered, \"areModulesRegistered\" is false at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("registering-modules");
        const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("registering-modules"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesRegistered).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesRegistered).toBeFalsy();
    });

    test.concurrent("when local modules and remote modules are ready, \"areModulesReady\" is true at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("ready");
        const remoteModuleRegistry = new DummyModuleRegistry("ready");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("ready"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeTruthy();
    });

    test.concurrent("when local modules and remote modules are ready, ModulesReadyEvent is dispatched at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("ready");
        const remoteModuleRegistry = new DummyModuleRegistry("ready");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("ready"),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when local modules are ready and no remote modules has been provided, \"areModulesReady\" is true at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("ready");
        const remoteModuleRegistry = new DummyModuleRegistry("none");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("ready"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeTruthy();
    });

    test.concurrent("when local modules are ready and no remote modules has been provided, ModulesReadyEvent is dispatched at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("ready");
        const remoteModuleRegistry = new DummyModuleRegistry("none");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("ready"),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when no local modules has been provided and remote modules are ready, \"areModulesReady\" is true at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("none");
        const remoteModuleRegistry = new DummyModuleRegistry("ready");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("none"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeTruthy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeTruthy();
    });

    test.concurrent("when no local modules has been provided and remote modules are ready, ModulesReadyEvent is dispatched at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("none");
        const remoteModuleRegistry = new DummyModuleRegistry("ready");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("none"),
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(ModulesRegisteredEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when local modules are ready and remote modules are not ready, \"areModulesReady\" is false at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("ready");
        const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("ready"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeFalsy();
    });

    test.concurrent("when local modules are not ready and remote modules are ready, \"areModulesReady\" is false at initialization", ({ expect }) => {
        // const localModuleRegistry = new DummyModuleRegistry("modules-registered");
        const remoteModuleRegistry = new DummyModuleRegistry("ready");

        // __setLocalModuleRegistry(localModuleRegistry);
        __setRemoteModuleRegistry(remoteModuleRegistry);

        const runtime = new FireflyRuntime({
            useMsw: false,
            localModulesRegistry: new DummyModuleRegistry("modules-registered"),
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].areModulesReady).toBeFalsy();
        expect(runtime.appRouterStore.state.areModulesReady).toBeFalsy();
    });

    test.concurrent("when msw is ready, \"isMswReady\" is true at initialization", ({ expect }) => {
        const mswState = new DummyMswState(true);

        __setMswState(mswState);

        const runtime = new FireflyRuntime({
            useMsw: false,
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].isMswReady).toBeTruthy();
        expect(runtime.appRouterStore.state.isMswReady).toBeTruthy();
    });

    test.concurrent("when msw is ready, MswReadyEvent is dispatched at initialization", ({ expect }) => {
        const mswState = new DummyMswState(true);

        __setMswState(mswState);

        const runtime = new FireflyRuntime({
            useMsw: false,
            loggers: [new NoopLogger()]
        });

        const listener = vi.fn();

        runtime.eventBus.addListener(MswReadyEvent, listener);

        renderUseAppRouterReducerHook(runtime, false, false);

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({ waitForMsw: false, waitForPublicData: false, waitForProtectedData: false });
    });

    test.concurrent("when msw is not ready, \"isMswReady\" is false at initialization", ({ expect }) => {
        const mswState = new DummyMswState(false);

        __setMswState(mswState);

        const runtime = new FireflyRuntime({
            useMsw: false,
            loggers: [new NoopLogger()]
        });

        const { result } = renderUseAppRouterReducerHook(runtime, false, false);

        expect(result.current[0].isMswReady).toBeFalsy();
        expect(runtime.appRouterStore.state.isMswReady).toBeFalsy();
    });
});

// describe("useModuleRegistrationStatusDispatcher", () => {
//     function renderUseModuleRegistrationStatusDispatcherHook<TProps>(areModulesRegistered: boolean, areModulesReady: boolean, dispatch: AppRouterDispatch, additionalProps: RenderHookOptions<TProps> = {}) {
//         const runtime = new FireflyRuntime({
//             loggers: [new NoopLogger()]
//         });

//         return renderHook(() => useModuleRegistrationStatusDispatcher(areModulesRegistered, areModulesReady, dispatch), {
//             wrapper: ({ children }: { children?: ReactNode }) => (
//                 <FireflyProvider runtime={runtime}>
//                     {children}
//                 </FireflyProvider>
//             ),
//             ...additionalProps
//         });
//     }

//     test.concurrent("when local modules and remote modules are not registered, do not dispatch the \"modules-registered\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("registering-modules");
//         const remoteModuleRegistry = new DummyModuleRegistry("registering-modules");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(false, false, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).not.toHaveBeenCalled();
//     });

//     test.concurrent("when local modules are registered but remote modules are not registered, do not dispatch the \"modules-registered\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("modules-registered");
//         const remoteModuleRegistry = new DummyModuleRegistry("registering-modules");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(false, false, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).not.toHaveBeenCalled();
//     });

//     test.concurrent("when local modules are not registered but remote modules are registered, do not dispatch the \"modules-registered\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("registering-modules");
//         const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(false, false, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).not.toHaveBeenCalled();
//     });

//     test.concurrent("when local modules and remote modules are registered, dispatch the \"modules-registered\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("modules-registered");
//         const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(false, false, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).toHaveBeenCalledTimes(1);
//         expect(dispatch).toHaveBeenCalledWith({ type: "modules-registered" });
//     });

//     test.concurrent("when local modules and remote modules are registered and \"areModulesRegistered\" is already true, do not dispatch the \"modules-registered\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("modules-registered");
//         const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(true, false, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).not.toHaveBeenCalled();
//     });

//     test.concurrent("when local modules and remote modules are not ready, do not dispatch the \"modules-ready\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("modules-registered");
//         const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(true, false, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).not.toHaveBeenCalled();
//     });

//     test.concurrent("when local modules are ready but remote modules are not ready, do not dispatch the \"modules-ready\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("ready");
//         const remoteModuleRegistry = new DummyModuleRegistry("modules-registered");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(true, false, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).not.toHaveBeenCalled();
//     });

//     test.concurrent("when local modules are not ready but remote modules are ready, do not dispatch the \"modules-ready\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("modules-registered");
//         const remoteModuleRegistry = new DummyModuleRegistry("ready");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(true, false, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).not.toHaveBeenCalled();
//     });

//     test.concurrent("when local modules and remote modules are ready, dispatch the \"modules-ready\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("ready");
//         const remoteModuleRegistry = new DummyModuleRegistry("ready");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(true, false, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).toHaveBeenCalledTimes(1);
//         expect(dispatch).toHaveBeenCalledWith({ type: "modules-ready" });
//     });

//     test.concurrent("when local modules and remote modules are ready and \"areModulesReady\" is already true, do not dispatch the \"modules-ready\" action", ({ expect }) => {
//         const localModuleRegistry = new DummyModuleRegistry("ready");
//         const remoteModuleRegistry = new DummyModuleRegistry("ready");

//         __setLocalModuleRegistry(localModuleRegistry);
//         __setRemoteModuleRegistry(remoteModuleRegistry);

//         const dispatch = vi.fn();

//         renderUseModuleRegistrationStatusDispatcherHook(true, true, dispatch);

//         localModuleRegistry.invokeEventListeners();
//         remoteModuleRegistry.invokeEventListeners();

//         expect(dispatch).not.toHaveBeenCalled();
//     });
// });

describe("useMswStatusDispatcher", () => {
    function renderUseMswStatusDispatcherHook<TProps>(isMswReady: boolean, dispatch: AppRouterDispatch, additionalProps: RenderHookOptions<TProps> = {}) {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        return renderHook(() => useMswStatusDispatcher(isMswReady, dispatch), {
            wrapper: ({ children }: { children?: ReactNode }) => (
                <FireflyProvider runtime={runtime}>
                    {children}
                </FireflyProvider>
            ),
            ...additionalProps
        });
    }

    test.concurrent("when msw is not ready, do not dispatch the \"msw-ready\" action", ({ expect }) => {
        const mswState = new DummyMswState(false);

        __setMswState(mswState);

        const dispatch = vi.fn();

        renderUseMswStatusDispatcherHook(false, dispatch);

        mswState.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });

    test.concurrent("when msw is ready, dispatch the \"msw-ready\" action", ({ expect }) => {
        const mswState = new DummyMswState(true);

        __setMswState(mswState);

        const dispatch = vi.fn();

        renderUseMswStatusDispatcherHook(false, dispatch);

        mswState.invokeEventListeners();

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith({ type: "msw-ready" });
    });

    test.concurrent("when msw is ready and \"isMswReady\" is already true, do not dispatch the \"msw-ready\" action", ({ expect }) => {
        const mswState = new DummyMswState(true);

        __setMswState(mswState);

        const dispatch = vi.fn();

        renderUseMswStatusDispatcherHook(true, dispatch);

        mswState.invokeEventListeners();

        expect(dispatch).not.toHaveBeenCalled();
    });
});
