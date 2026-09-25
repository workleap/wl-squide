// IMPORTANT: The tests in this file cannot be concurrent because they rely on mock.invocationCallOrder,
// which is a global counter in Vitest that tracks the order of all mock function calls across all tests.

import {
    LocalModuleRegistrationFailedEvent,
    LocalModulesDeferredRegistrationCompletedEvent,
    LocalModulesDeferredRegistrationStartedEvent,
    LocalModulesRegistrationCompletedEvent,
    LocalModulesRegistrationStartedEvent,
    ModuleManager,
    toLocalModuleDefinitions
} from "@squide/core";
import { LocalModuleRegistry } from "@squide/core/internal";
import { Plugin, type PluginReadyListener, type Runtime } from "@squide/core";
import { MswPlugin } from "@squide/msw";
import { ProtectedRoutes } from "@squide/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import { useEffect, type ReactNode } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { test, vi } from "vitest";
import { AppRouter as FireflyAppRouter } from "../src/AppRouter.tsx";
import { ApplicationBoostrappedEvent, ModulesReadyEvent, ModulesRegisteredEvent, MswReadyEvent, PluginsReadyEvent, ProtectedDataReadyEvent, PublicDataReadyEvent } from "../src/AppRouterReducer.ts";
import { FireflyProvider } from "../src/FireflyProvider.tsx";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";
import { ApplicationBootstrappingStartedEvent, bootstrap } from "../src/initializeFirefly.ts";
import { useDeferredRegistrations } from "../src/useDeferredRegistrations.ts";
import { useIsBootstrapping } from "../src/useIsBootstrapping.ts";
import { ProtectedDataFetchStartedEvent, useProtectedDataQueries } from "../src/useProtectedDataQueries.ts";
import { PublicDataFetchStartedEvent, usePublicDataQueries } from "../src/usePublicDataQueries.ts";
import { createQueryClient } from "./utils.ts";

interface AppRouterProps {
    waitForPublicData: boolean;
    waitForProtectedData: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialEntries: any;
    initialIndex: number;
    bootstrappingRoute: ReactNode;
}

function AppRouter(props: AppRouterProps) {
    const {
        waitForPublicData,
        waitForProtectedData,
        initialEntries,
        initialIndex,
        bootstrappingRoute
    } = props;

    return (
        <FireflyAppRouter waitForPublicData={waitForPublicData} waitForProtectedData={waitForProtectedData}>
            {({ rootRoute, registeredRoutes, routerProps, routerProviderProps }) => {
                return (
                    <RouterProvider
                        router={createMemoryRouter([
                            {
                                element: rootRoute,
                                children: [
                                    {
                                        element: bootstrappingRoute,
                                        children: registeredRoutes
                                    }
                                ]
                            }
                        ], {
                            ...routerProps,
                            initialEntries,
                            initialIndex
                        })}
                        {...routerProviderProps}
                    />
                );
            }}
        </FireflyAppRouter>
    );
}

// A plugin implementing the readiness surface, with a latch that the test flips once the router is rendered.
class DummyReadyPlugin extends Plugin {
    #isReady = false;

    readonly #readyListeners = new Set<PluginReadyListener>();

    constructor(runtime: Runtime) {
        super("dummy-ready-plugin", runtime);
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

    // New work started, the status goes back to not ready without notifying anyone.
    setAsNotReady() {
        this.#isReady = false;
    }
}

function renderAppRouter(props: AppRouterProps, runtime: FireflyRuntime) {
    const queryClient = createQueryClient();

    return render(<AppRouter {...props} />, {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                <FireflyProvider runtime={runtime}>
                    {children}
                </FireflyProvider>
            </QueryClientProvider>
        )
    });
}

test("msw + local modules + public data + protected data + local deferred", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const runtime = new FireflyRuntime({
        plugins: [
            x => new MswPlugin(x)
        ],
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const onApplicationBootstrappingStarted = vi.fn();
    const onLocalModulesRegistrationStarted = vi.fn();
    const onLocalModulesRegistrationCompleted = vi.fn();
    const onModulesRegistered = vi.fn();
    const onMswReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onLocalModulesDeferredRegistrationStarted = vi.fn();
    const onLocalModulesDeferredRegistrationCompleted = vi.fn();
    const onModulesReady = vi.fn();
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModules = toLocalModuleDefinitions([
        x => {
            x.registerRoute({
                children: [ProtectedRoutes]
            }, {
                hoist: true
            });

            x.registerRoute({
                path: "/foo",
                element: "bar"
            });

            // Deferred registration.
            return () => {};
        }
    ]);

    bootstrap(runtime, [
        ...localModules
    ], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitUntil(() => localModuleRegistry.registrationStatus === "modules-registered");

    function BootstrappingRoute() {
        usePublicDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }]);

        useProtectedDataQueries([{
            queryKey: ["john"],
            queryFn: () => "doe"
        }], () => false);

        useDeferredRegistrations({});

        if (useIsBootstrapping()) {
            return "loading";
        }

        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForPublicData: true,
        waitForProtectedData: true,
        initialEntries: ["/foo"],
        initialIndex: 0,
        bootstrappingRoute: <BootstrappingRoute />
    };

    renderAppRouter(props, runtime);

    await waitFor(() => screen.findByText("loading"));
    await waitFor(() => screen.findByText("bar"));

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesRegistered).toHaveBeenCalledOnce();
    expect(onMswReady).toHaveBeenCalledOnce();
    expect(onPublicDataFetchStarted).toHaveBeenCalledOnce();
    expect(onPublicDataReady).toHaveBeenCalledOnce();
    expect(onProtectedDataFetchStarted).toHaveBeenCalledOnce();
    expect(onProtectedDataReady).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesReady).toHaveBeenCalledOnce();
    expect(onApplicationBoostrapped).toHaveBeenCalledOnce();

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    MswReadyEvent
    //    PublicDataFetchStartedEvent - ProtectedDataFetchStartedEvent
    //    PublicDataReadyEvent - ProtectedDataReadyEvent
    //    LocalModuleDeferredRegistrationStartedEvent
    //    LocalModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules + public data + protected data", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const runtime = new FireflyRuntime({
        plugins: [
            x => new MswPlugin(x)
        ],
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const onApplicationBootstrappingStarted = vi.fn();
    const onLocalModulesRegistrationStarted = vi.fn();
    const onLocalModulesRegistrationCompleted = vi.fn();
    const onModulesReady = vi.fn();
    const onMswReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModules = toLocalModuleDefinitions([
        x => {
            x.registerRoute({
                children: [
                    ProtectedRoutes
                ]
            }, {
                hoist: true
            });

            x.registerRoute({
                path: "/foo",
                element: "bar"
            });
        }
    ]);

    bootstrap(runtime, [
        ...localModules
    ], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitUntil(() => localModuleRegistry.registrationStatus === "ready");

    function BootstrappingRoute() {
        usePublicDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }]);

        useProtectedDataQueries([{
            queryKey: ["john"],
            queryFn: () => "doe"
        }], () => false);

        if (useIsBootstrapping()) {
            return "loading";
        }

        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForPublicData: true,
        waitForProtectedData: true,
        initialEntries: ["/foo"],
        initialIndex: 0,
        bootstrappingRoute: <BootstrappingRoute />
    };

    renderAppRouter(props, runtime);

    await waitFor(() => screen.findByText("loading"));
    await waitFor(() => screen.findByText("bar"));

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesReady).toHaveBeenCalledOnce();
    expect(onMswReady).toHaveBeenCalledOnce();
    expect(onPublicDataFetchStarted).toHaveBeenCalledOnce();
    expect(onPublicDataReady).toHaveBeenCalledOnce();
    expect(onProtectedDataFetchStarted).toHaveBeenCalledOnce();
    expect(onProtectedDataReady).toHaveBeenCalledOnce();
    expect(onApplicationBoostrapped).toHaveBeenCalledOnce();

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    MswReadyEvent
    //    PublicDataFetchStartedEvent - ProtectedDataFetchStartedEvent
    //    PublicDataReadyEvent - ProtectedDataReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules + public data + local deferred", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const runtime = new FireflyRuntime({
        plugins: [
            x => new MswPlugin(x)
        ],
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const onApplicationBootstrappingStarted = vi.fn();
    const onLocalModulesRegistrationStarted = vi.fn();
    const onLocalModulesRegistrationCompleted = vi.fn();
    const onModulesRegistered = vi.fn();
    const onMswReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onLocalModulesDeferredRegistrationStarted = vi.fn();
    const onLocalModulesDeferredRegistrationCompleted = vi.fn();
    const onModulesReady = vi.fn();
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModules = toLocalModuleDefinitions([
        x => {
            x.registerRoute({
                children: [
                    ProtectedRoutes
                ]
            }, {
                hoist: true
            });

            x.registerRoute({
                path: "/foo",
                element: "bar"
            });

            // Deferred registration.
            return () => {};
        }
    ]);

    bootstrap(runtime, [
        ...localModules
    ], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitUntil(() => localModuleRegistry.registrationStatus === "modules-registered");

    function BootstrappingRoute() {
        usePublicDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }]);

        useDeferredRegistrations({});

        if (useIsBootstrapping()) {
            return "loading";
        }

        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForPublicData: true,
        waitForProtectedData: false,
        initialEntries: ["/foo"],
        initialIndex: 0,
        bootstrappingRoute: <BootstrappingRoute />
    };

    renderAppRouter(props, runtime);

    await waitFor(() => screen.findByText("loading"));
    await waitFor(() => screen.findByText("bar"));

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesRegistered).toHaveBeenCalledOnce();
    expect(onMswReady).toHaveBeenCalledOnce();
    expect(onPublicDataFetchStarted).toHaveBeenCalledOnce();
    expect(onPublicDataReady).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesReady).toHaveBeenCalledOnce();
    expect(onApplicationBoostrapped).toHaveBeenCalledOnce();

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    MswReadyEvent
    //    PublicDataFetchStartedEvent
    //    PublicDataReadyEvent
    //    LocalModuleDeferredRegistrationStartedEvent
    //    LocalModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules + protected data + local deferred", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const runtime = new FireflyRuntime({
        plugins: [
            x => new MswPlugin(x)
        ],
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const onApplicationBootstrappingStarted = vi.fn();
    const onLocalModulesRegistrationStarted = vi.fn();
    const onLocalModulesRegistrationCompleted = vi.fn();
    const onModulesRegistered = vi.fn();
    const onMswReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onLocalModulesDeferredRegistrationStarted = vi.fn();
    const onLocalModulesDeferredRegistrationCompleted = vi.fn();
    const onModulesReady = vi.fn();
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModules = toLocalModuleDefinitions([
        x => {
            x.registerRoute({
                children: [
                    ProtectedRoutes
                ]
            }, {
                hoist: true
            });

            x.registerRoute({
                path: "/foo",
                element: "bar"
            });

            // Deferred registration.
            return () => {};
        }
    ]);

    bootstrap(runtime, [
        ...localModules
    ], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitUntil(() => localModuleRegistry.registrationStatus === "modules-registered");

    function BootstrappingRoute() {
        useProtectedDataQueries([{
            queryKey: ["john"],
            queryFn: () => "doe"
        }], () => false);

        useDeferredRegistrations({});

        if (useIsBootstrapping()) {
            return "loading";
        }

        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForPublicData: false,
        waitForProtectedData: true,
        initialEntries: ["/foo"],
        initialIndex: 0,
        bootstrappingRoute: <BootstrappingRoute />
    };

    renderAppRouter(props, runtime);

    await waitFor(() => screen.findByText("loading"));
    await waitFor(() => screen.findByText("bar"));

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesRegistered).toHaveBeenCalledOnce();
    expect(onMswReady).toHaveBeenCalledOnce();
    expect(onProtectedDataFetchStarted).toHaveBeenCalledOnce();
    expect(onProtectedDataReady).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesReady).toHaveBeenCalledOnce();
    expect(onApplicationBoostrapped).toHaveBeenCalledOnce();

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    MswReadyEvent
    //    ProtectedDataFetchStartedEvent
    //    ProtectedDataReadyEvent
    //    LocalModuleDeferredRegistrationStartedEvent
    //    LocalModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const runtime = new FireflyRuntime({
        plugins: [
            x => new MswPlugin(x)
        ],
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const onApplicationBootstrappingStarted = vi.fn();
    const onLocalModulesRegistrationStarted = vi.fn();
    const onLocalModulesRegistrationCompleted = vi.fn();
    const onModulesReady = vi.fn();
    const onMswReady = vi.fn();
    const onPluginsReady = vi.fn();
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PluginsReadyEvent, onPluginsReady);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModules = toLocalModuleDefinitions([
        x => {
            x.registerRoute({
                children: [
                    ProtectedRoutes
                ]
            }, {
                hoist: true
            });

            x.registerRoute({
                path: "/foo",
                element: "bar"
            });
        }
    ]);

    bootstrap(runtime, [
        ...localModules
    ], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitUntil(() => localModuleRegistry.registrationStatus === "ready");

    function BootstrappingRoute() {
        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForPublicData: false,
        waitForProtectedData: false,
        initialEntries: ["/foo"],
        initialIndex: 0,
        bootstrappingRoute: <BootstrappingRoute />
    };

    renderAppRouter(props, runtime);

    await waitFor(() => screen.findByText("bar"));

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onMswReady).toHaveBeenCalledOnce();
    expect(onModulesReady).toHaveBeenCalledOnce();
    expect(onApplicationBoostrapped).toHaveBeenCalledOnce();

    // Without a plugin implementing the readiness surface, the event sequence is the same as before the surface existed.
    expect(onPluginsReady).not.toHaveBeenCalled();

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    MswReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules + readiness-aware plugin", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const runtime = new FireflyRuntime({
        plugins: [
            x => new MswPlugin(x),
            x => new DummyReadyPlugin(x)
        ],
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const onApplicationBootstrappingStarted = vi.fn();
    const onLocalModulesRegistrationStarted = vi.fn();
    const onLocalModulesRegistrationCompleted = vi.fn();
    const onModulesRegistered = vi.fn();
    const onModulesReady = vi.fn();
    const onMswReady = vi.fn();
    const onPluginsReady = vi.fn();
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PluginsReadyEvent, onPluginsReady);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModules = toLocalModuleDefinitions([
        x => {
            x.registerRoute({
                children: [
                    ProtectedRoutes
                ]
            }, {
                hoist: true
            });

            x.registerRoute({
                path: "/foo",
                element: "bar"
            });
        }
    ]);

    bootstrap(runtime, [
        ...localModules
    ], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    // The router is rendered while the plugin latch is still pending.
    await vi.waitUntil(() => localModuleRegistry.registrationStatus === "ready");

    function BootstrappingRoute() {
        if (useIsBootstrapping()) {
            return <div>Loading...</div>;
        }

        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForPublicData: false,
        waitForProtectedData: false,
        initialEntries: ["/foo"],
        initialIndex: 0,
        bootstrappingRoute: <BootstrappingRoute />
    };

    renderAppRouter(props, runtime);

    // The page must not render before the plugin is ready.
    await screen.findByText("Loading...");

    expect(onPluginsReady).not.toHaveBeenCalled();
    expect(onApplicationBoostrapped).not.toHaveBeenCalled();

    act(() => {
        (runtime.getPlugin("dummy-ready-plugin") as DummyReadyPlugin).setAsReady();
    });

    await waitFor(() => screen.findByText("bar"));

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesRegistered).toHaveBeenCalledOnce();
    expect(onMswReady).toHaveBeenCalledOnce();
    expect(onPluginsReady).toHaveBeenCalledOnce();
    expect(onModulesReady).toHaveBeenCalledOnce();
    expect(onApplicationBoostrapped).toHaveBeenCalledOnce();

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    ModulesReadyEvent
    //    MswReadyEvent
    //    PluginsReadyEvent
    //    ApplicationBoostrappedEvent
    //
    // The relative position of PluginsReadyEvent isn't guaranteed: a plugin subscribes to the module registries from its
    // constructor, before the AppRouter effects do, therefore a plugin becoming ready synchronously with the registration
    // could dispatch PluginsReadyEvent before ModulesRegisteredEvent. Only its position relative to the bootstrapping
    // completion is asserted.
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPluginsReady.mock.invocationCallOrder[0]);

    expect(onPluginsReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules + public data + readiness-aware plugin starting work once the data is fetched", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const runtime = new FireflyRuntime({
        plugins: [
            x => new MswPlugin(x),
            x => new DummyReadyPlugin(x)
        ],
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const plugin = runtime.getPlugin("dummy-ready-plugin") as DummyReadyPlugin;

    // Ready before the data is fetched, like the i18next plugin once the resources of the detected language are loaded.
    plugin.setAsReady();

    const onPublicDataReady = vi.fn();
    const onPluginsReady = vi.fn();
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(PluginsReadyEvent, onPluginsReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModules = toLocalModuleDefinitions([
        x => {
            x.registerRoute({
                children: [
                    ProtectedRoutes
                ]
            }, {
                hoist: true
            });

            x.registerRoute({
                path: "/foo",
                element: "bar"
            });
        }
    ]);

    bootstrap(runtime, [
        ...localModules
    ], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitUntil(() => localModuleRegistry.registrationStatus === "ready");

    function BootstrappingRoute() {
        const [data] = usePublicDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }]);

        // Mimics a bootstrapping route switching to the preferred language carried by the data: the plugin starts
        // new work from an effect of the bootstrapping route, once the data is fetched.
        useEffect(() => {
            if (data) {
                plugin.setAsNotReady();
            }
        }, [data]);

        if (useIsBootstrapping()) {
            return "loading";
        }

        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForPublicData: true,
        waitForProtectedData: false,
        initialEntries: ["/foo"],
        initialIndex: 0,
        bootstrappingRoute: <BootstrappingRoute />
    };

    renderAppRouter(props, runtime);

    await waitFor(() => expect(onPublicDataReady).toHaveBeenCalledOnce());

    // The work started by the bootstrapping route holds the render, even though the plugin was ready before the data
    // was fetched: the plugins are consulted once every other input is ready, after the bootstrapping route effects.
    await screen.findByText("loading");

    expect(onPluginsReady).not.toHaveBeenCalled();
    expect(screen.queryByText("bar")).toBeNull();

    act(() => {
        plugin.setAsReady();
    });

    await waitFor(() => screen.findByText("bar"));

    expect(onPluginsReady).toHaveBeenCalledOnce();
    expect(onApplicationBoostrapped).toHaveBeenCalledOnce();

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onPluginsReady.mock.invocationCallOrder[0]);
    expect(onPluginsReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("local modules + public data + protected data + local deferred", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const runtime = new FireflyRuntime({
        plugins: [
            x => new MswPlugin(x)
        ],
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const onApplicationBootstrappingStarted = vi.fn();
    const onLocalModulesRegistrationStarted = vi.fn();
    const onLocalModulesRegistrationCompleted = vi.fn();
    const onModulesRegistered = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onLocalModulesDeferredRegistrationStarted = vi.fn();
    const onLocalModulesDeferredRegistrationCompleted = vi.fn();
    const onModulesReady = vi.fn();
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModules = toLocalModuleDefinitions([
        x => {
            x.registerRoute({
                children: [
                    ProtectedRoutes
                ]
            }, {
                hoist: true
            });

            x.registerRoute({
                path: "/foo",
                element: "bar"
            });

            // Deferred registration.
            return () => {};
        }
    ]);

    bootstrap(runtime, [
        ...localModules
    ], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitUntil(() => localModuleRegistry.registrationStatus === "modules-registered");

    function BootstrappingRoute() {
        usePublicDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }]);

        useProtectedDataQueries([{
            queryKey: ["john"],
            queryFn: () => "doe"
        }], () => false);

        useDeferredRegistrations({});

        if (useIsBootstrapping()) {
            return "loading";
        }

        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForPublicData: true,
        waitForProtectedData: true,
        initialEntries: ["/foo"],
        initialIndex: 0,
        bootstrappingRoute: <BootstrappingRoute />
    };

    renderAppRouter(props, runtime);

    await waitFor(() => screen.findByText("loading"));
    await waitFor(() => screen.findByText("bar"));

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesRegistered).toHaveBeenCalledOnce();
    expect(onPublicDataFetchStarted).toHaveBeenCalledOnce();
    expect(onPublicDataReady).toHaveBeenCalledOnce();
    expect(onProtectedDataFetchStarted).toHaveBeenCalledOnce();
    expect(onProtectedDataReady).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesReady).toHaveBeenCalledOnce();
    expect(onApplicationBoostrapped).toHaveBeenCalledOnce();

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    PublicDataFetchStartedEvent - ProtectedDataFetchStartedEvent
    //    PublicDataReadyEvent - ProtectedDataReadyEvent
    //    LocalModuleDeferredRegistrationStartedEvent
    //    LocalModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("failing local module registration", async ({ expect }) => {
    const localModuleRegistry = new LocalModuleRegistry();

    const runtime = new FireflyRuntime({
        plugins: [
            x => new MswPlugin(x)
        ],
        moduleManager: x => new ModuleManager(x, [
            localModuleRegistry
        ]),
        loggers: [new NoopLogger()]
    });

    const onApplicationBootstrappingStarted = vi.fn();
    const onLocalModulesRegistrationStarted = vi.fn();
    const onLocalModulesRegistrationCompleted = vi.fn();
    const onLocalModuleRegistrationFailed = vi.fn();
    const onModulesRegistered = vi.fn();
    const onMswReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onLocalModulesDeferredRegistrationStarted = vi.fn();
    const onLocalModulesDeferredRegistrationCompleted = vi.fn();
    const onModulesReady = vi.fn();
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(LocalModuleRegistrationFailedEvent, onLocalModuleRegistrationFailed);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModules = toLocalModuleDefinitions([
        x => {
            x.registerRoute({
                children: [
                    ProtectedRoutes
                ]
            }, {
                hoist: true
            });

            x.registerRoute({
                path: "/foo",
                element: "bar"
            });

            // Deferred registration.
            return () => {};
        },
        () => {
            throw new Error("Module 2 registration error.");
        }
    ]);

    bootstrap(runtime, [
        ...localModules
    ], {
        startMsw: vi.fn(() => Promise.resolve())
    });

    await vi.waitUntil(() => localModuleRegistry.registrationStatus === "modules-registered");

    function BootstrappingRoute() {
        usePublicDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }]);

        useProtectedDataQueries([{
            queryKey: ["john"],
            queryFn: () => "doe"
        }], () => false);

        useDeferredRegistrations({});

        if (useIsBootstrapping()) {
            return "loading";
        }

        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForPublicData: true,
        waitForProtectedData: true,
        initialEntries: ["/foo"],
        initialIndex: 0,
        bootstrappingRoute: <BootstrappingRoute />
    };

    renderAppRouter(props, runtime);

    await waitFor(() => screen.findByText("loading"));
    await waitFor(() => screen.findByText("bar"));

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onLocalModuleRegistrationFailed).toHaveBeenCalledOnce();
    expect(onModulesRegistered).toHaveBeenCalledOnce();
    expect(onMswReady).toHaveBeenCalledOnce();
    expect(onPublicDataFetchStarted).toHaveBeenCalledOnce();
    expect(onPublicDataReady).toHaveBeenCalledOnce();
    expect(onProtectedDataFetchStarted).toHaveBeenCalledOnce();
    expect(onProtectedDataReady).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledOnce();
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledOnce();
    expect(onModulesReady).toHaveBeenCalledOnce();
    expect(onApplicationBoostrapped).toHaveBeenCalledOnce();

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent - RemoteModulesRegistrationStartedEvent
    //    LocalModuleRegistrationFailed
    //    LocalModulesRegistrationCompletedEvent - RemoteModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    MswReadyEvent
    //    PublicDataFetchStartedEvent - ProtectedDataFetchStartedEvent
    //    PublicDataReadyEvent - ProtectedDataReadyEvent
    //    LocalModuleDeferredRegistrationStartedEvent - RemoteModuleDeferredRegistrationStartedEvent
    //    LocalModuleDeferredRegistrationCompletedEvent - RemoteModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModuleRegistrationFailed.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});
