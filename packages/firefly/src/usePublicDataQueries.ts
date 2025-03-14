import { useEventBus } from "@squide/core";
import { useQueries, type QueriesOptions, type QueriesResults, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useAppRouterDispatcher } from "./AppRouterContext.ts";
import { GlobalDataQueriesError } from "./GlobalDataQueriesError.ts";
import { useCanFetchPublicData } from "./useCanFetchPublicData.ts";
import { useExecuteOnce } from "./useExecuteOnce.ts";

export const PublicDataFetchStartedEvent = "squide-public-data-fetch-started";
export const PublicDataFetchFailedEvent = "squide-public-data-fetch-failed";

// This converts an array of UseQueryResult to an array of the data type of each query result.
// For more information, view: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-1.html#mapped-types-on-tuples-and-arrays.
type MapUseQueryResultToData<T> = { [K in keyof T]: T[K] extends UseQueryResult<infer U> ? U : never };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePublicDataQueries<T extends Array<any>>(queries: QueriesOptions<T>): MapUseQueryResultToData<QueriesResults<T>> {
    const canFetchPublicData = useCanFetchPublicData();
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
            enabled: canFetchPublicData,
            ...x
        })),
        combine: combineResults
    });

    useExecuteOnce(useCallback(() => {
        if (canFetchPublicData) {
            eventBus.dispatch(PublicDataFetchStartedEvent);

            return true;
        }

        return false;
    }, [canFetchPublicData, eventBus]), true);

    // Using a ref seems to be the only way to prevent starting two deferred registrations scope.
    const isReadyRef = useRef(false);

    const dispatchReady = useExecuteOnce(useCallback(() => {
        if (isReady) {
            isReadyRef.current = true;

            dispatch({ type: "public-data-ready" });

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
            dispatch({ type: "public-data-updated" });
        }
    }, [data, dispatch]);

    useEffect(() => {
        if (hasErrors) {
            eventBus.dispatch(PublicDataFetchFailedEvent, queriesErrors);

            throw new GlobalDataQueriesError("[squide] Global public data queries failed.", queriesErrors);
        }
    }, [hasErrors, queriesErrors, eventBus]);

    return data;
}
