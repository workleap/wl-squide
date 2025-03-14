import { SessionManagerContext, useToastListener } from "@basic-mix/shared";
import { AppRouter as FireflyAppRouter, useIsBootstrapping, useLogger } from "@squide/firefly";
import { useCallback } from "react";
import { Outlet, createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Loading } from "./Loading.tsx";
import { RootErrorBoundary } from "./RootErrorBoundary.tsx";
import { ToastContainer, useToastContainer } from "./toast.tsx";
import { useSessionManagerInstance } from "./useSessionManagerInstance.ts";

function BootstrappingRoute() {
    const { toastState, addToast } = useToastContainer();

    const handleShowToast = useCallback((message: string) => {
        addToast(message);
    }, [addToast]);

    useToastListener(handleShowToast);

    const sessionManager = useSessionManagerInstance();

    if (useIsBootstrapping()) {
        return <Loading />;
    }

    return (
        <SessionManagerContext.Provider value={sessionManager}>
            <ToastContainer state={toastState}>
                <Outlet />
            </ToastContainer>
        </SessionManagerContext.Provider>
    );
}

export function AppRouter() {
    const logger = useLogger();

    return (
        <FireflyAppRouter waitForMsw={false}>
            {({ rootRoute, registeredRoutes, routerProviderProps }) => {
                logger.debug("[shell] React Router will be rendered with the following route definitions: ", registeredRoutes);

                return (
                    <RouterProvider
                        router={createBrowserRouter([
                            {
                                element: rootRoute,
                                errorElement: <RootErrorBoundary />,
                                children: [
                                    {
                                        element: <BootstrappingRoute />,
                                        children: registeredRoutes
                                    }
                                ]
                            }
                        ], {
                            future: {
                                v7_relativeSplatPath: false,
                                v7_startTransition: false,
                                v7_partialHydration: false
                            }
                        })}
                        {...routerProviderProps}
                    />
                );
            }}
        </FireflyAppRouter>
    );
}
