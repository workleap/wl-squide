import { isNil } from "@squide/core/internal";
import { createContext, useContext } from "react";
import type { AppRouterDispatch, AppRouterState } from "./AppRouterReducer.ts";

export const AppRouterStateContext = createContext<AppRouterState | undefined>(undefined);

export function useAppRouterState() {
    const state = useContext(AppRouterStateContext);

    if (isNil(state)) {
        throw new Error("[squide] The useAppRouterState hook must be called by a children of the AppRouter component.");
    }

    return state;
}

export const AppRouterDispatcherContext = createContext<AppRouterDispatch | undefined>(undefined);

export function useAppRouterDispatcher() {
    const dispatch = useContext(AppRouterDispatcherContext);

    if (isNil(dispatch)) {
        throw new Error("[squide] The useAppRouterDispatcher hook must be called by a children of the AppRouter component.");
    }

    return dispatch;
}
