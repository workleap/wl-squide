import { useLogger, useRuntime } from "@squide/core";
import { useRoutes, type Route } from "@squide/react-router";
import { useEffect, useMemo, type ReactElement } from "react";
import { DataStrategyFunction, DataStrategyFunctionArgs, DataStrategyResult, DOMRouterOpts } from "react-router";
import type { RouterProviderProps } from "react-router/dom";
import { AppRouterDispatcherContext, AppRouterStateContext } from "./AppRouterContext.ts";
import { useAppRouterReducer, type AppRouterState } from "./AppRouterReducer.ts";
import { FireflyRuntime } from "./FireflyRuntime.tsx";
import { RootRoute } from "./RootRoute.tsx";
import { useStrictRegistrationMode } from "./useStrictRegistrationMode.ts";

export interface AppRouterRenderFunctionArgs {
    routes: Route[];
}

export interface RenderRouterProviderFunctionArgs {
    rootRoute: ReactElement;
    registeredRoutes: Route[];
    routerProps: DOMRouterOpts;
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

// This is a custom React Router data strategy (https://reactrouter.com/api/data-routers/createMemoryRouter#optsdatastrategy)
// to delay the execution of React Router data browser loaders until MSW is ready.
// The data strategy implemention is copied from React Router default data strategy: https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/router/router.ts#L5710.
function createWaitForMswDataStrategy(runtime: FireflyRuntime) {
    const strategy: (args: DataStrategyFunctionArgs<unknown>) => ReturnType<DataStrategyFunction<unknown>> = async args => {
        await new Promise(resolve => {
            if (runtime.mswState.isReady) {
                resolve(null);
            } else {
                const handler = () => {
                    runtime.mswState.removeMswReadyListener(handler);
                    resolve(null);
                };

                runtime.mswState.addMswReadyListener(handler);
            }
        });

        const matchesToLoad = args.matches.filter(m => m.shouldCallHandler);
        const keyedResults: Record<string, DataStrategyResult> = {};
        const results = await Promise.all(matchesToLoad.map(m => m.resolve()));

        results.forEach((result, i) => {
            keyedResults[matchesToLoad[i].route.id] = result;
        });

        return keyedResults;
    };

    return strategy;
}

function useRenderRouterProvider(state: AppRouterState, renderRouterProvider: RenderRouterProviderFunction, strictMode: boolean) {
    const runtime = useRuntime() as FireflyRuntime;
    const routes = useRoutes();

    // The value is computed outside of the router provider memo to prevent
    // rendering a new router provider everytime the app router state change.
    const canRenderRouter = useCanRenderRouter(state);

    return useMemo(() => {
        if (canRenderRouter) {
            return renderRouterProvider({
                rootRoute: <RootRoute strictMode={strictMode} />,
                registeredRoutes: routes,
                routerProps: {
                    dataStrategy: runtime.isMswEnabled ? createWaitForMswDataStrategy(runtime) : undefined
                },
                routerProviderProps: {}
            });
        }

        return null;
    }, [runtime, canRenderRouter, routes, renderRouterProvider, strictMode]);
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
