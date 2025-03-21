import { QueryClient } from "@tanstack/react-query";
import type { AppRouterState } from "../src/AppRouterReducer.ts";

export function sleep(delay: number) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

export function createDefaultAppRouterState(): AppRouterState {
    return {
        waitForMsw: false,
        waitForProtectedData: false,
        waitForPublicData: false,
        areModulesReady: false,
        areModulesRegistered: false,
        activeRouteVisibility: "unknown",
        isMswReady: false,
        isProtectedDataReady: false,
        isPublicDataReady: false,
        isUnauthorized: false
    };
}

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                // View: https://tanstack.com/query/latest/docs/framework/react/guides/testing#set-gctime-to-infinity-with-jest.
                gcTime: Infinity
            }
        }
    });
}
