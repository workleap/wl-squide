import { useLogger } from "@squide/core";
import { useRoutes, type Route } from "@squide/react-router";
import { useEffect, useMemo, type ReactElement } from "react";
import type { RouterProviderProps } from "react-router/dom";
import { AppRouterDispatcherContext, AppRouterStateContext } from "./AppRouterContext.ts";
import { useAppRouterReducer, type AppRouterState } from "./AppRouterReducer.ts";
import { RootRoute } from "./RootRoute.tsx";
import { useStrictRegistrationMode } from "./useStrictRegistrationMode.ts";

export interface AppRouterRenderFunctionArgs {
    routes: Route[];
}

export interface RenderRouterProviderFunctionArgs {
    rootRoute: ReactElement;
    registeredRoutes: Route[];
    routerProviderProps: Omit<RouterProviderProps, "router">;
}

export type RenderRouterProviderFunction = (args: RenderRouterProviderFunctionArgs) => ReactElement;

export function useCanRenderRouter({ areModulesRegistered, areModulesReady: areModulesReadyValue }: AppRouterState) {
    return (
        // Wait until the modules has been registered, but do not wait for the deferred registrations to be registered has they will probably
        // depends on the protected data.
        (areModulesRegistered || areModulesReadyValue)
    );
}

function useRenderRouterProvider(state: AppRouterState, renderRouterProvider: RenderRouterProviderFunction, strictMode: boolean) {
    const routes = useRoutes();

    // The value is computed outside of the router provider memo to prevent
    // rendering a new router provider everytime the app router state change.
    const canRenderRouter = useCanRenderRouter(state);

    return useMemo(() => {
        if (canRenderRouter) {
            return renderRouterProvider({
                rootRoute: <RootRoute strictMode={strictMode} />,
                registeredRoutes: routes,
                routerProviderProps: {}
            });
        }

        return null;
    }, [canRenderRouter, routes, renderRouterProvider, strictMode]);
}

export interface AppRouterProps {
    waitForPublicData?: boolean;
    waitForProtectedData?: boolean;
    strictMode?: boolean;
    children: RenderRouterProviderFunction;
}

export function AppRouter(props: AppRouterProps) {
    const {
        waitForPublicData = false,
        waitForProtectedData = false,
        strictMode = true,
        children: renderRouterProvider
    } = props;
    const [state, dispatch] = useAppRouterReducer(waitForPublicData, waitForProtectedData);

    const logger = useLogger();

    useStrictRegistrationMode({
        isEnabled: strictMode
    });

    useEffect(() => {
        logger
            .withText("[squide] AppRouter state has been updated to:")
            .withObject(state)
            .debug();
    }, [state, logger]);

    const routerProvider = useRenderRouterProvider(state, renderRouterProvider, strictMode);

    return (
        <AppRouterDispatcherContext.Provider value={dispatch}>
            <AppRouterStateContext.Provider value={state}>
                {routerProvider}
            </AppRouterStateContext.Provider>
        </AppRouterDispatcherContext.Provider>
    );
}
