import {
    __clearLocalModuleRegistry,
    __setLocalModuleRegistry,
    LocalModuleRegistrationFailedEvent,
    LocalModuleRegistry,
    LocalModulesDeferredRegistrationCompletedEvent,
    LocalModulesDeferredRegistrationStartedEvent,
    LocalModulesRegistrationCompletedEvent,
    LocalModulesRegistrationStartedEvent,
    RuntimeContext,
    type Runtime
} from "@squide/core";
import {
    __clearRemoteModuleRegistry,
    __setRemoteModuleRegistry,
    RemoteModuleRegistrationFailedEvent,
    RemoteModuleRegistry,
    RemoteModulesDeferredRegistrationCompletedEvent,
    RemoteModulesDeferredRegistrationStartedEvent,
    RemoteModulesRegistrationCompletedEvent,
    RemoteModulesRegistrationStartedEvent
} from "@squide/module-federation";
import { ProtectedRoutes } from "@squide/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { AppRouter as FireflyAppRouter } from "../src/AppRouter.tsx";
import { ApplicationBoostrappedEvent, ModulesReadyEvent, ModulesRegisteredEvent, MswReadyEvent, ProtectedDataReadyEvent, PublicDataReadyEvent } from "../src/AppRouterReducer.ts";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";
import { __resetHasExecuteGuard, ApplicationBootstrappingStartedEvent, bootstrap } from "../src/boostrap.ts";
import { useDeferredRegistrations } from "../src/useDeferredRegistrations.ts";
import { useIsBootstrapping } from "../src/useIsBootstrapping.ts";
import { ProtectedDataFetchStartedEvent, useProtectedDataQueries } from "../src/useProtectedDataQueries.ts";
import { PublicDataFetchStartedEvent, usePublicDataQueries } from "../src/usePublicDataQueries.ts";
import { createQueryClient } from "./utils.ts";

interface AppRouterProps {
    waitForMsw: boolean;
    waitForPublicData: boolean;
    waitForProtectedData: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialEntries: any;
    initialIndex: number;
    bootstrappingRoute: ReactNode;
}

function AppRouter(props: AppRouterProps) {
    const {
        waitForMsw,
        waitForPublicData,
        waitForProtectedData,
        initialEntries,
        initialIndex,
        bootstrappingRoute
    } = props;

    return (
        <FireflyAppRouter waitForMsw={waitForMsw} waitForPublicData={waitForPublicData} waitForProtectedData={waitForProtectedData}>
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
                <RuntimeContext.Provider value={runtime}>
                    {children}
                </RuntimeContext.Provider>
            </QueryClientProvider>
        )
    });
}

afterEach(() => {
    __resetHasExecuteGuard();
    __clearLocalModuleRegistry();
    __clearRemoteModuleRegistry();
});

test("msw + local modules + remote modules + public data + protected data + local deferred + remote deferred", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onModulesRegistered = jest.fn();
    const onMswReady = jest.fn();
    const onPublicDataFetchStarted = jest.fn();
    const onPublicDataReady = jest.fn();
    const onProtectedDataFetchStarted = jest.fn();
    const onProtectedDataReady = jest.fn();
    const onLocalModulesDeferredRegistrationStarted = jest.fn();
    const onLocalModulesDeferredRegistrationCompleted = jest.fn();
    const onRemoteModulesDeferredRegistrationStarted = jest.fn();
    const onRemoteModulesDeferredRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationStartedEvent, onRemoteModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, onRemoteModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        // Deferred registration.
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

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
        waitForMsw: true,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent - RemoteModulesRegistrationStartedEvent
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
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules + remote modules + public data + protected data", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onMswReady = jest.fn();
    const onPublicDataFetchStarted = jest.fn();
    const onPublicDataReady = jest.fn();
    const onProtectedDataFetchStarted = jest.fn();
    const onProtectedDataReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

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
        waitForMsw: true,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent - RemoteModulesRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent - RemoteModulesRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    MswReadyEvent
    //    PublicDataFetchStartedEvent - ProtectedDataFetchStartedEvent
    //    PublicDataReadyEvent - ProtectedDataReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

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

test("msw + local modules + remote modules + public data + local deferred + remote deferred", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onModulesRegistered = jest.fn();
    const onMswReady = jest.fn();
    const onPublicDataFetchStarted = jest.fn();
    const onPublicDataReady = jest.fn();
    const onLocalModulesDeferredRegistrationStarted = jest.fn();
    const onLocalModulesDeferredRegistrationCompleted = jest.fn();
    const onRemoteModulesDeferredRegistrationStarted = jest.fn();
    const onRemoteModulesDeferredRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationStartedEvent, onRemoteModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, onRemoteModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        // Deferred registration.
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

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
        waitForMsw: true,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent - RemoteModulesRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent - RemoteModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    MswReadyEvent
    //    PublicDataFetchStartedEvent
    //    PublicDataReadyEvent
    //    LocalModuleDeferredRegistrationStartedEvent - RemoteModuleDeferredRegistrationStartedEvent
    //    LocalModuleDeferredRegistrationCompletedEvent - RemoteModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules + remote modules + protected data + local deferred + remote deferred", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onModulesRegistered = jest.fn();
    const onMswReady = jest.fn();
    const onProtectedDataFetchStarted = jest.fn();
    const onProtectedDataReady = jest.fn();
    const onLocalModulesDeferredRegistrationStarted = jest.fn();
    const onLocalModulesDeferredRegistrationCompleted = jest.fn();
    const onRemoteModulesDeferredRegistrationStarted = jest.fn();
    const onRemoteModulesDeferredRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationStartedEvent, onRemoteModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, onRemoteModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        // Deferred registration.
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

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
        waitForMsw: true,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent - RemoteModulesRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent - RemoteModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    MswReadyEvent
    //    ProtectedDataFetchStartedEvent
    //    ProtectedDataReadyEvent
    //    LocalModuleDeferredRegistrationStartedEvent - RemoteModuleDeferredRegistrationStartedEvent
    //    LocalModuleDeferredRegistrationCompletedEvent - RemoteModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules + remote modules", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onMswReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

    function BootstrappingRoute() {
        return <Outlet />;
    }

    const props: AppRouterProps = {
        waitForMsw: true,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent - RemoteModulesRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent - RemoteModulesRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    MswReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("msw + local modules + remote modules + public data + protected data + local deferred", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onModulesRegistered = jest.fn();
    const onMswReady = jest.fn();
    const onPublicDataFetchStarted = jest.fn();
    const onPublicDataReady = jest.fn();
    const onProtectedDataFetchStarted = jest.fn();
    const onProtectedDataReady = jest.fn();
    const onLocalModulesDeferredRegistrationStarted = jest.fn();
    const onLocalModulesDeferredRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
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

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        register: () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

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
        waitForMsw: true,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
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
    //    LocalModulesRegistrationCompletedEvent - RemoteModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    MswReadyEvent
    //    PublicDataFetchStartedEvent - ProtectedDataFetchStartedEvent
    //    PublicDataReadyEvent - ProtectedDataReadyEvent
    //    LocalModuleDeferredRegistrationStartedEvent
    //    LocalModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

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

test("msw + local modules + remote modules + public data + protected data + remote deferred", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onModulesRegistered = jest.fn();
    const onMswReady = jest.fn();
    const onPublicDataFetchStarted = jest.fn();
    const onPublicDataReady = jest.fn();
    const onProtectedDataFetchStarted = jest.fn();
    const onProtectedDataReady = jest.fn();
    const onRemoteModulesDeferredRegistrationStarted = jest.fn();
    const onRemoteModulesDeferredRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationStartedEvent, onRemoteModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, onRemoteModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        // Deferred registration.
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

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
        waitForMsw: true,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent - RemoteModulesRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent - RemoteModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    MswReadyEvent
    //    PublicDataFetchStartedEvent - ProtectedDataFetchStartedEvent
    //    PublicDataReadyEvent - ProtectedDataReadyEvent
    //    RemoteModuleDeferredRegistrationStartedEvent
    //    RemoteModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("local modules + remote modules + public data + protected data + local deferred + remote deferred", async () => {
    const runtime = new FireflyRuntime({
        useMsw: false
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onModulesRegistered = jest.fn();
    const onPublicDataFetchStarted = jest.fn();
    const onPublicDataReady = jest.fn();
    const onProtectedDataFetchStarted = jest.fn();
    const onProtectedDataReady = jest.fn();
    const onLocalModulesDeferredRegistrationStarted = jest.fn();
    const onLocalModulesDeferredRegistrationCompleted = jest.fn();
    const onRemoteModulesDeferredRegistrationStarted = jest.fn();
    const onRemoteModulesDeferredRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationStartedEvent, onRemoteModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, onRemoteModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        // Deferred registration.
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

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
        waitForMsw: false,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent - RemoteModulesRegistrationStartedEvent
    //    LocalModulesRegistrationCompletedEvent - RemoteModulesRegistrationCompletedEvent
    //    ModulesRegisteredEvent
    //    PublicDataFetchStartedEvent - ProtectedDataFetchStartedEvent
    //    PublicDataReadyEvent - ProtectedDataReadyEvent
    //    LocalModuleDeferredRegistrationStartedEvent - RemoteModuleDeferredRegistrationStartedEvent
    //    LocalModuleDeferredRegistrationCompletedEvent - RemoteModuleDeferredRegistrationCompletedEvent
    //    ModulesReadyEvent
    //    ApplicationBoostrappedEvent
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("failing local module registration", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onLocalModuleRegistrationFailed = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onModulesRegistered = jest.fn();
    const onMswReady = jest.fn();
    const onPublicDataFetchStarted = jest.fn();
    const onPublicDataReady = jest.fn();
    const onProtectedDataFetchStarted = jest.fn();
    const onProtectedDataReady = jest.fn();
    const onLocalModulesDeferredRegistrationStarted = jest.fn();
    const onLocalModulesDeferredRegistrationCompleted = jest.fn();
    const onRemoteModulesDeferredRegistrationStarted = jest.fn();
    const onRemoteModulesDeferredRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(LocalModuleRegistrationFailedEvent, onLocalModuleRegistrationFailed);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationStartedEvent, onRemoteModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, onRemoteModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn().mockResolvedValue({
        // Deferred registration.
        register: () => () => {}
    });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

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
        waitForMsw: true,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
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
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModuleRegistrationFailed.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});

test("failing remote module registration", async () => {
    const runtime = new FireflyRuntime({
        useMsw: true
    });

    const onApplicationBootstrappingStarted = jest.fn();
    const onLocalModulesRegistrationStarted = jest.fn();
    const onLocalModulesRegistrationCompleted = jest.fn();
    const onRemoteModulesRegistrationStarted = jest.fn();
    const onRemoteModulesRegistrationCompleted = jest.fn();
    const onRemoteModuleRegistrationFailed = jest.fn();
    const onModulesRegistered = jest.fn();
    const onMswReady = jest.fn();
    const onPublicDataFetchStarted = jest.fn();
    const onPublicDataReady = jest.fn();
    const onProtectedDataFetchStarted = jest.fn();
    const onProtectedDataReady = jest.fn();
    const onLocalModulesDeferredRegistrationStarted = jest.fn();
    const onLocalModulesDeferredRegistrationCompleted = jest.fn();
    const onRemoteModulesDeferredRegistrationStarted = jest.fn();
    const onRemoteModulesDeferredRegistrationCompleted = jest.fn();
    const onModulesReady = jest.fn();
    const onApplicationBoostrapped = jest.fn();

    runtime.eventBus.addListener(ApplicationBootstrappingStartedEvent, onApplicationBootstrappingStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationStartedEvent, onLocalModulesRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, onLocalModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesRegistrationStartedEvent, onRemoteModulesRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, onRemoteModulesRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModuleRegistrationFailedEvent, onRemoteModuleRegistrationFailed);
    runtime.eventBus.addListener(ModulesRegisteredEvent, onModulesRegistered);
    runtime.eventBus.addListener(MswReadyEvent, onMswReady);
    runtime.eventBus.addListener(PublicDataFetchStartedEvent, onPublicDataFetchStarted);
    runtime.eventBus.addListener(PublicDataReadyEvent, onPublicDataReady);
    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, onProtectedDataFetchStarted);
    runtime.eventBus.addListener(ProtectedDataReadyEvent, onProtectedDataReady);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationStartedEvent, onLocalModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, onLocalModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationStartedEvent, onRemoteModulesDeferredRegistrationStarted);
    runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, onRemoteModulesDeferredRegistrationCompleted);
    runtime.eventBus.addListener(ModulesReadyEvent, onModulesReady);
    runtime.eventBus.addListener(ApplicationBoostrappedEvent, onApplicationBoostrapped);

    const localModuleRegistry = new LocalModuleRegistry();

    const loadRemote = jest.fn()
        .mockResolvedValueOnce({
            register: () => { throw new Error("Remote module registration error."); }
        })
        .mockResolvedValueOnce({
            register: () => () => {}
        });

    const remoteModuleRegistry = new RemoteModuleRegistry(loadRemote);

    __setLocalModuleRegistry(localModuleRegistry);
    __setRemoteModuleRegistry(remoteModuleRegistry);

    await bootstrap(runtime, {
        localModules: [
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
        ],
        remotes: [
            { name: "Dummy-1" },
            { name: "Dummy-2" }
        ],
        startMsw: jest.fn(() => Promise.resolve())
    });

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
        waitForMsw: true,
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
    expect(onRemoteModulesRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onRemoteModuleRegistrationFailed).toHaveBeenCalledTimes(1);
    expect(onModulesRegistered).toHaveBeenCalledTimes(1);
    expect(onMswReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onLocalModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationStarted).toHaveBeenCalledTimes(1);
    expect(onRemoteModulesDeferredRegistrationCompleted).toHaveBeenCalledTimes(1);
    expect(onModulesReady).toHaveBeenCalledTimes(1);
    expect(onApplicationBoostrapped).toHaveBeenCalledTimes(1);

    // Expected order is:
    //    ApplicationBootstrappingStartedEvent
    //    LocalModuleRegistrationStartedEvent - RemoteModulesRegistrationStartedEvent
    //    RemoteModuleRegistrationFailed
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
    expect(onApplicationBootstrappingStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onRemoteModuleRegistrationFailed.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);
    expect(onRemoteModulesRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesRegistered.mock.invocationCallOrder[0]);

    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onMswReady.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onModulesRegistered.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onMswReady.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationStarted.mock.invocationCallOrder[0]).toBeLessThan(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]);

    expect(onLocalModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);
    expect(onRemoteModulesDeferredRegistrationCompleted.mock.invocationCallOrder[0]).toBeLessThan(onModulesReady.mock.invocationCallOrder[0]);

    expect(onModulesReady.mock.invocationCallOrder[0]).toBeLessThan(onApplicationBoostrapped.mock.invocationCallOrder[0]);
});
