import { useLogger } from "@squide/core";
import { useRoutes, type Route } from "@squide/react-router";
import { useEffect, useMemo, type ReactElement } from "react";
import type { RouterProviderProps } from "react-router/dom";
import { AppRouterDispatcherContext, AppRouterStateContext } from "./AppRouterContext.ts";
import { useAppRouterReducer } from "./AppRouterReducer.ts";
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

export interface AppRouterProps {
    waitForMsw: boolean;
    waitForPublicData?: boolean;
    waitForProtectedData?: boolean;
    children: RenderRouterProviderFunction;
}

export function AppRouter(props: AppRouterProps) {
    const {
        waitForMsw,
        waitForPublicData = false,
        waitForProtectedData = false,
        children: renderRouterProvider
    } = props;

    const [state, dispatch] = useAppRouterReducer(waitForMsw, waitForPublicData, waitForProtectedData);

    const logger = useLogger();
    const routes = useRoutes();

    useStrictRegistrationMode();

    useEffect(() => {
        logger.debug("[squide] AppRouter state updated:", state);
    }, [state, logger]);

    const routerProvider = useMemo(() => {
        return renderRouterProvider({
            rootRoute: <RootRoute />,
            registeredRoutes: routes,
            routerProviderProps: {}
        });
    }, [routes, renderRouterProvider]);

    return (
        <AppRouterDispatcherContext.Provider value={dispatch}>
            <AppRouterStateContext.Provider value={state}>
                {routerProvider}
            </AppRouterStateContext.Provider>
        </AppRouterDispatcherContext.Provider>
    );
}
