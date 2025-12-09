// IMPORTANT: Tests in this file cannot run concurrently because they use React Testing Library's
// "render" function which renders components into a shared DOM environment (document.body). When tests run concurrently,
// they all share the same DOM, causing queries like "screen.findByText()"" to find elements from other concurrent
// tests. This is different from "renderHook" which can run concurrently because it doesn't render into the DOM.

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import { Component, type PropsWithChildren, type ReactNode } from "react";
import { afterEach, beforeEach, describe, test, vi, type MockInstance } from "vitest";
import { AppRouterDispatcherContext, AppRouterStateContext } from "../src/AppRouterContext.ts";
import type { AppRouterDispatch, AppRouterState } from "../src/AppRouterReducer.ts";
import { FireflyProvider } from "../src/FireflyProvider.tsx";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";
import { PublicDataFetchFailedEvent, PublicDataFetchStartedEvent, usePublicDataQueries } from "../src/usePublicDataQueries.ts";
import { createDefaultAppRouterState, createQueryClient } from "./utils.ts";

function renderAppRouter(appRouter: ReactNode, runtime: FireflyRuntime, state: AppRouterState, dispatch: AppRouterDispatch, queryClient?: QueryClient) {
    const client = queryClient ?? createQueryClient();

    return render(appRouter, {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <FireflyProvider runtime={runtime}>
                <AppRouterDispatcherContext.Provider value={dispatch}>
                    <AppRouterStateContext.Provider value={state}>
                        <QueryClientProvider client={client}>
                            {children}
                        </QueryClientProvider>
                    </AppRouterStateContext.Provider>
                </AppRouterDispatcherContext.Provider>
            </FireflyProvider>
        )
    });
}

test("when queries are executed, PublicDataFetchStartedEvent is dispatched", async ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const dispatch = vi.fn();
    const listener = vi.fn();

    runtime.eventBus.addListener(PublicDataFetchStartedEvent, listener);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.isMswReady = true;

    function AppRouter() {
        const [data] = usePublicDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }]);

        return data;
    }

    renderAppRouter(<AppRouter />, runtime, state, dispatch);

    await waitFor(() => screen.findByText("bar"));

    expect(listener).toHaveBeenCalledOnce();
});

test("when data is ready, \"public-data-ready\" is dispatched", async ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const dispatch = vi.fn();

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.isMswReady = true;

    function AppRouter() {
        const [data] = usePublicDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }]);

        return data;
    }

    renderAppRouter(<AppRouter />, runtime, state, dispatch);

    await waitFor(() => screen.findByText("bar"));

    expect(dispatch).toHaveBeenCalledTimes(2);

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "public-data-ready"
    }));

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "public-data-updated"
    }));
});

test("when data is updated, \"public-data-updated\" is dispatched", async ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const dispatch = vi.fn();

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.isMswReady = true;

    const queryClient = createQueryClient();

    const queryFn = vi.fn()
        .mockResolvedValueOnce("bar")
        .mockResolvedValueOnce("toto");

    function AppRouter() {
        const [data] = usePublicDataQueries([{
            queryKey: ["foo"],
            queryFn
        }]);

        return data;
    }

    renderAppRouter(<AppRouter />, runtime, state, dispatch, queryClient);

    await waitFor(() => screen.findByText("bar"));

    queryClient.refetchQueries({
        queryKey: ["foo"]
    });

    await waitFor(() => screen.findByText("toto"));

    expect(dispatch).toHaveBeenCalledTimes(3);

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "public-data-ready"
    }));

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "public-data-updated"
    }));
});

describe("when a query fail", () => {
    let consoleMock: MockInstance;

    beforeEach(() => {
        consoleMock = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleMock.mockRestore();
    });

    test("should throw an error", async ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();

        const state = createDefaultAppRouterState();
        state.areModulesRegistered = true;
        state.isMswReady = true;

        class ErrorBoundary extends Component<PropsWithChildren, { error?: Error }> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            constructor(props: any) {
                super(props);

                this.state = { error: undefined };
            }

            static getDerivedStateFromError(error: unknown) {
                return { error };
            }

            render() {
                const { children } = this.props;
                const { error } = this.state;

                if (error) {
                    return error.message;
                }

                return children;
            }
        }

        function AppRouter() {
            const [data] = usePublicDataQueries([{
                queryKey: ["foo"],
                queryFn: () => { throw new Error("Query failed."); }
            }]);

            return data;
        }

        renderAppRouter(<ErrorBoundary><AppRouter /></ErrorBoundary>, runtime, state, dispatch);

        const element = await waitFor(() => screen.findByText("[squide] Global public data queries failed."));

        expect(element).toBeDefined();
    });

    test("should dispatch PublicDataFetchFailedEvent", async ({ expect }) => {
        const runtime = new FireflyRuntime({
            loggers: [new NoopLogger()]
        });

        const dispatch = vi.fn();
        const listener = vi.fn();

        runtime.eventBus.addListener(PublicDataFetchFailedEvent, listener);

        const state = createDefaultAppRouterState();
        state.areModulesRegistered = true;
        state.isMswReady = true;

        class ErrorBoundary extends Component<PropsWithChildren, { error?: Error }> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            constructor(props: any) {
                super(props);

                this.state = { error: undefined };
            }

            static getDerivedStateFromError(error: unknown) {
                return { error };
            }

            render() {
                const { children } = this.props;
                const { error } = this.state;

                if (error) {
                    return error.message;
                }

                return children;
            }
        }

        const queryError = new Error("Query failed.");

        function AppRouter() {
            const [data] = usePublicDataQueries([{
                queryKey: ["foo"],
                queryFn: () => { throw queryError; }
            }]);

            return data;
        }

        renderAppRouter(<ErrorBoundary><AppRouter /></ErrorBoundary>, runtime, state, dispatch);

        await waitFor(() => screen.findByText("[squide] Global public data queries failed."));

        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith(expect.arrayContaining([queryError]));
    });
});
