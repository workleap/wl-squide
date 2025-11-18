import {
    LocalModuleRegistrationFailedEvent,
    LocalModulesDeferredRegistrationCompletedEvent,
    LocalModulesDeferredRegistrationStartedEvent,
    LocalModulesRegistrationCompletedEvent,
    LocalModulesRegistrationStartedEvent,
    ModuleManager,
    toLocalModuleDefinitions,
    type Runtime
} from "@squide/core";
import { LocalModuleRegistry } from "@squide/core/internal";
import { MswPlugin } from "@squide/msw";
import { ProtectedRoutes } from "@squide/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import type { ReactNode } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { expect, test, vi } from "vitest";
import { AppRouter as FireflyAppRouter } from "../src/AppRouter.tsx";
import { ApplicationBoostrappedEvent, ModulesReadyEvent, ModulesRegisteredEvent, MswReadyEvent, ProtectedDataReadyEvent, PublicDataReadyEvent } from "../src/AppRouterReducer.ts";
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
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
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

function renderAppRouter(props: AppRouterProps, runtime: Runtime) {
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

test("msw + local modules + public data + protected data + local deferred", async () => {
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

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

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

test("msw + local modules + public data + protected data", async () => {
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

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

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

test("msw + local modules + public data + local deferred", async () => {
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

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

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

test("msw + local modules + protected data + local deferred", async () => {
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

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

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

test("msw + local modules", async () => {
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
    const onApplicationBoostrapped = vi.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
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

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

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

test("local modules + public data + protected data + local deferred", async () => {
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

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

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

test("failing local module registration", async () => {
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

    expect(onApplicationBootstrappingStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onLocalModuleRegistrationFailed).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

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
