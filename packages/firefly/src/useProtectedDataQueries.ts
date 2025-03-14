import { useEventBus } from "@squide/core";
import { useQueries, type QueriesOptions, type QueriesResults, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useAppRouterDispatcher, useAppRouterState } from "./AppRouterContext.ts";
import { GlobalDataQueriesError } from "./GlobalDataQueriesError.ts";
import { useCanFetchProtectedData } from "./useCanFetchProtectedData.ts";
import { useExecuteOnce } from "./useExecuteOnce.ts";

export const ProtectedDataFetchStartedEvent = "squide-protected-data-fetch-started";
export const ProtectedDataFetchFailedEvent = "squide-protected-data-fetch-failed";

export type IsUnauthorizedErrorCallback = (error: unknown) => boolean;

// This converts an array of UseQueryResult to an array of the data type of each query result.
// For more information, view: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-1.html#mapped-types-on-tuples-and-arrays.
type MapUseQueryResultToData<T> = { [K in keyof T]: T[K] extends UseQueryResult<infer U> ? U : never };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useProtectedDataQueries<T extends Array<any>>(queries: QueriesOptions<T>, isUnauthorizedError: IsUnauthorizedErrorCallback): MapUseQueryResultToData<QueriesResults<T>> {
    const canFetchProtectedData = useCanFetchProtectedData();
    const eventBus = useEventBus();

    const dispatch = useAppRouterDispatcher();

    const combineResults = useCallback((results: UseQueryResult<unknown, unknown>[]) => {
        const errors = results.filter(x => x.error).map(x => x.error) as Error[];
        const hasErrors = errors.length > 0;

        return {
            data: results.map(x => x.data) as MapUseQueryResultToData<QueriesResults<T>>,
            errors,
            hasErrors,
            isReady: !hasErrors && !results.some(x => x.isPending)
        };
    }, []);

    const { data, errors: queriesErrors, hasErrors, isReady } = useQueries({
        queries: queries.map(x => ({
            enabled: canFetchProtectedData,
            ...x
        })),
        combine: combineResults
    });

    const { isProtectedDataReady, isUnauthorized } = useAppRouterState();

    useExecuteOnce(useCallback(() => {
        if (canFetchProtectedData) {
            eventBus.dispatch(ProtectedDataFetchStartedEvent);

            return true;
        }

        return false;
    }, [canFetchProtectedData, eventBus]), true);

    // Using a ref seems to be the only way to prevent starting two deferred registrations scope.
    const isReadyRef = useRef(false);

    const dispatchReady = useExecuteOnce(useCallback(() => {
        if (isReady) {
            isReadyRef.current = true;

            dispatch({ type: "protected-data-ready" });

            return true;
        }

        return false;
    }, [isReady, dispatch]));

    useEffect(() => {
        // State update must be executed in useEffect.
        dispatchReady();
    }, [dispatchReady]);

    useEffect(() => {
        if (isReadyRef.current && data) {
            dispatch({ type: "protected-data-updated" });
        }
    }, [data, dispatch]);

    useEffect(() => {
        if (hasErrors) {
            if (!isProtectedDataReady && !isUnauthorized && queriesErrors.some(x => isUnauthorizedError(x))) {
                // Will transition the state to allow the routes to render even if the bootstrapping is not complete, because otherwise
                // a login page for example could not be rendered.
                dispatch({ type: "is-unauthorized" });
            }

            // Otherwise, when a user is logged off, a refetch might throws a 401.
            if (!queriesErrors.every(x => isUnauthorizedError(x))) {
                eventBus.dispatch(ProtectedDataFetchFailedEvent, queriesErrors);

                throw new GlobalDataQueriesError("[squide] Global protected data queries failed.", queriesErrors);
            }
        }
    }, [hasErrors, queriesErrors, isProtectedDataReady, isUnauthorized, isUnauthorizedError, dispatch, eventBus]);

    return data;
}
