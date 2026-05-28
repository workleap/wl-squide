import { useRuntimeNavigationItemsByMenu } from "@squide/react-router";
import { useAppRouterState } from "./AppRouterContext.ts";

export function useNavigationItemsByMenu() {
    // See useNavigationItems.ts for the rationale behind subscribing to the AppRouter state — it ensures
    // a re-render when deferred registrations update the registry.
    useAppRouterState();

    return useRuntimeNavigationItemsByMenu();
}
