import { useMemo } from "react";
import { matchRoutes } from "react-router";
import { useRoutes } from "./useRoutes.ts";

export interface UseRouteMatchOptions {
    throwWhenThereIsNoMatch?: boolean;
}

export function useRouteMatch(locationArg: Partial<Location>, { throwWhenThereIsNoMatch = true }: UseRouteMatchOptions = {}) {
    const routes = useRoutes();

    return useMemo(() => {
        const matchingRoutes = matchRoutes(routes, locationArg) ?? [];

        if (matchingRoutes.length > 0) {
            // When a route is nested, it also returns all the parts that constituate the whole route (for example the layouts and the boundaries).
            // We only want to know the visiblity of the actual route that has been requested, which is always the last entry.
            return matchingRoutes[matchingRoutes.length - 1]!.route;
        } else {
            if (throwWhenThereIsNoMatch) {
                throw new Error(`[squide] There's no matching route for the location: "${locationArg.pathname}". Did you add routes to React Router without using the runtime.registerRoute() function?`);
            }
        }

        return undefined;
    }, [locationArg, routes, throwWhenThereIsNoMatch]);
}
