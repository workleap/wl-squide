import { type Runtime, RuntimeContext } from "@squide/core";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Component, type PropsWithChildren, type ReactNode } from "react";
import { AppRouterDispatcherContext, AppRouterStateContext } from "../src/AppRouterContext.ts";
import type { AppRouterDispatch, AppRouterState } from "../src/AppRouterReducer.ts";
import { FireflyRuntime } from "../src/FireflyRuntime.tsx";
import { ProtectedDataFetchFailedEvent, ProtectedDataFetchStartedEvent, useProtectedDataQueries } from "../src/useProtectedDataQueries.ts";
import { createDefaultAppRouterState, createQueryClient } from "./utils.ts";

function renderAppRouter(appRouter: ReactNode, runtime: Runtime, state: AppRouterState, dispatch: AppRouterDispatch, queryClient?: QueryClient) {
    const client = queryClient ?? createQueryClient();

    return render(appRouter, {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <RuntimeContext.Provider value={runtime}>
                <AppRouterDispatcherContext.Provider value={dispatch}>
                    <AppRouterStateContext.Provider value={state}>
                        <QueryClientProvider client={client}>
                            {children}
                        </QueryClientProvider>
                    </AppRouterStateContext.Provider>
                </AppRouterDispatcherContext.Provider>
            </RuntimeContext.Provider>
        )
    });
}

test("when queries are executed, ProtectedDataFetchStartedEvent is dispatched", async () => {
    const runtime = new FireflyRuntime();

    const dispatch = jest.fn();
    const listener = jest.fn();

    runtime.eventBus.addListener(ProtectedDataFetchStartedEvent, listener);

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.activeRouteVisibility = "protected";
    state.activeRouteVisibility = "protected";
    state.isMswReady = true;

    function AppRouter() {
        const [data] = useProtectedDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }], () => false);

        return data;
    }

    renderAppRouter(<AppRouter />, runtime, state, dispatch);

    await waitFor(() => screen.findByText("bar"));

    expect(listener).toHaveBeenCalledTimes(1);
});

test("when data is ready, \"protected-data-ready\" is dispatched", async () => {
    const runtime = new FireflyRuntime();

    const dispatch = jest.fn();

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.activeRouteVisibility = "protected";
    state.isMswReady = true;

    function AppRouter() {
        const [data] = useProtectedDataQueries([{
            queryKey: ["foo"],
            queryFn: () => "bar"
        }], () => false);

        return data;
    }

    renderAppRouter(<AppRouter />, runtime, state, dispatch);

    await waitFor(() => screen.findByText("bar"));

    expect(dispatch).toHaveBeenCalledTimes(2);

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "protected-data-ready"
    }));

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "protected-data-updated"
    }));
});

test("when data is updated, \"protected-data-updated\" is dispatched", async () => {
    const runtime = new FireflyRuntime();

    const dispatch = jest.fn();

    const state = createDefaultAppRouterState();
    state.areModulesRegistered = true;
    state.activeRouteVisibility = "protected";
    state.isMswReady = true;

    const queryClient = createQueryClient();

    const queryFn = jest.fn()
        .mockResolvedValueOnce("bar")
        .mockResolvedValueOnce("toto");

    function AppRouter() {
        const [data] = useProtectedDataQueries([{
            queryKey: ["foo"],
            queryFn
        }], () => false);

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
        type: "protected-data-ready"
    }));

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
        type: "protected-data-updated"
    }));
});

describe("when a query fail", () => {
    let consoleMock: jest.SpyInstance;

    beforeEach(() => {
        consoleMock = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleMock.mockRestore();
    });

    test("should throw an error", async () => {
        const runtime = new FireflyRuntime();

        const dispatch = jest.fn();

        const state = createDefaultAppRouterState();
        state.areModulesRegistered = true;
        state.activeRouteVisibility = "protected";
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
            const [data] = useProtectedDataQueries([{
                queryKey: ["foo"],
                queryFn: () => { throw new Error("Query failed."); }
            }], () => false);

            return data;
        }

        renderAppRouter(<ErrorBoundary><AppRouter /></ErrorBoundary>, runtime, state, dispatch);

        const element = await waitFor(() => screen.findByText("[squide] Global protected data queries failed."));

        expect(element).toBeDefined();
    });

    test("when it's a unauthorized error, \"is-unauthorized\" is dispatched", async () => {
        const runtime = new FireflyRuntime();

        const dispatch = jest.fn();

        const state = createDefaultAppRouterState();
        state.areModulesRegistered = true;
        state.activeRouteVisibility = "protected";
        state.isMswReady = true;

        function AppRouter() {
            const data = useProtectedDataQueries([
                {
                    queryKey: ["foo"],
                    queryFn: () => { throw new Error("Unauthorized error."); }
                },
                {
                    queryKey: ["john"],
                    queryFn: () => "doe"
                }
            ], () => true);

            return data[1];
        }

        renderAppRouter(<AppRouter />, runtime, state, dispatch);

        await waitFor(() => screen.findByText("doe"));

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: "is-unauthorized"
        }));
    });

    test("should dispatch ProtectedDataFetchFailedEvent", async () => {
        const runtime = new FireflyRuntime();

        const dispatch = jest.fn();
        const listener = jest.fn();

        runtime.eventBus.addListener(ProtectedDataFetchFailedEvent, listener);

        const state = createDefaultAppRouterState();
        state.areModulesRegistered = true;
        state.activeRouteVisibility = "protected";
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
            const [data] = useProtectedDataQueries([{
                queryKey: ["foo"],
                queryFn: () => { throw queryError; }
            }], () => false);

            return data;
        }

        renderAppRouter(<ErrorBoundary><AppRouter /></ErrorBoundary>, runtime, state, dispatch);

        await waitFor(() => screen.findByText("[squide] Global protected data queries failed."));

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.arrayContaining([queryError]));
    });

    test("when a query fail and it's a unauthorized error, ProtectedDataFetchFailedEvent is not dispatched", async () => {
        const runtime = new FireflyRuntime();

        const dispatch = jest.fn();
        const listener = jest.fn();

        runtime.eventBus.addListener(ProtectedDataFetchFailedEvent, listener);

        const state = createDefaultAppRouterState();
        state.areModulesRegistered = true;
        state.activeRouteVisibility = "protected";
        state.isMswReady = true;

        function AppRouter() {
            const data = useProtectedDataQueries([
                {
                    queryKey: ["foo"],
                    queryFn: () => { throw new Error("Unauthorized error."); }
                },
                {
                    queryKey: ["john"],
                    queryFn: () => "doe"
                }
            ], () => true);

            return data[1];
        }

        renderAppRouter(<AppRouter />, runtime, state, dispatch);

        await waitFor(() => screen.findByText("doe"));

        expect(listener).not.toHaveBeenCalled();
    });
});
