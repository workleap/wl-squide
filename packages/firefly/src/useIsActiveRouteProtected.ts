import { useIsRouteProtected, useRouteMatch } from "@squide/react-router";
import { useLocation } from "react-router";

export function useIsActiveRouteProtected(areModulesReady: boolean) {
    // Using this hook instead of window.location to retrieve the current location because it triggers a re-render everytime the browser location change.
    const location = useLocation();

    // Only throw when there's no match if the modules are ready, otherwise it's expected that no route will be found since they are not all registered yet.
    const activeRoute = useRouteMatch(location, { throwWhenThereIsNoMatch: areModulesReady });

    return useIsRouteProtected(activeRoute);
}
