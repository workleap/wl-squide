import { RuntimeContext } from "@squide/core";
import { renderHook, type RenderHookOptions } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import { test } from "vitest";
import { ReactRouterRuntime } from "../src/reactRouterRuntime2.ts";
import { useRoutes } from "../src/useRoutes.ts";

function renderUseRoutesHook<TProps>(runtime: ReactRouterRuntime, additionalProps: RenderHookOptions<TProps> = {}) {
    return renderHook(() => useRoutes(), {
        wrapper: ({ children }) => (
            <RuntimeContext.Provider value={runtime}>
                {children}
            </RuntimeContext.Provider>
        ),
        ...additionalProps
    });
}

test.concurrent("returns all the registered routes", ({ expect }) => {
    const runtime = new ReactRouterRuntime({
        loggers: [new NoopLogger()]
    });

    runtime.registerRoute({
        path: "/foo",
        element: <div>Foo</div>
    }, {
        hoist: true
    });

    runtime.registerRoute({
        path: "/bar",
        element: <div>Bar</div>
    }, {
        hoist: true
    });

    const { result } = renderUseRoutesHook(runtime);

    expect(result.current.length).toBe(2);
});

test.concurrent("returned array is immutable", ({ expect }) => {
    const runtime = new ReactRouterRuntime({
        loggers: [new NoopLogger()]
    });

    runtime.registerRoute({
        path: "/foo",
        element: <div>Foo</div>
    }, {
        hoist: true
    });

    const { result, rerender } = renderUseRoutesHook(runtime);

    const array1 = result.current;

    // Haven't updated the routes, the returned array should be "array1".
    rerender();

    const array2 = result.current;

    runtime.registerRoute({
        path: "/bar",
        element: <div>Bar</div>
    }, {
        hoist: true
    });

    // Added a new route, the returned array should be a new instance.
    rerender();

    const array3 = result.current;

    expect(array1).toEqual(array2);
    expect(array1).not.toEqual(array3);
});
