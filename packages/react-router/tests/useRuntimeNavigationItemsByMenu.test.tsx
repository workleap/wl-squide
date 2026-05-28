import { RuntimeContext } from "@squide/core";
import { renderHook } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import type { ReactNode } from "react";
import { test } from "vitest";
import { ReactRouterRuntime } from "../src/ReactRouterRuntime.ts";
import { useRuntimeNavigationItemsByMenu } from "../src/useRuntimeNavigationItemsByMenu.ts";

function renderUseNavigationItemsByMenuHook(runtime: ReactRouterRuntime) {
    return renderHook(() => useRuntimeNavigationItemsByMenu(), {
        wrapper: ({ children }: { children?: ReactNode }) => (
            <RuntimeContext.Provider value={runtime}>
                {children}
            </RuntimeContext.Provider>
        )
    });
}

test.concurrent("returns a Map grouped by menu id across multiple menus", ({ expect }) => {
    const runtime = new ReactRouterRuntime({
        loggers: [new NoopLogger()]
    });

    runtime.registerNavigationItem({
        $label: "Root",
        to: "/root"
    });

    runtime.registerNavigationItem({
        $label: "Item A",
        to: "/item-a"
    }, {
        menuId: "menu-a"
    });

    runtime.registerNavigationItem({
        $label: "Item B",
        to: "/item-b"
    }, {
        menuId: "menu-b"
    });

    const { result } = renderUseNavigationItemsByMenuHook(runtime);

    expect(result.current.size).toBe(3);
    expect(result.current.get("root")!.length).toBe(1);
    expect(result.current.get("menu-a")!.length).toBe(1);
    expect(result.current.get("menu-b")!.length).toBe(1);
});

test.concurrent("returns an empty Map when no items have been registered", ({ expect }) => {
    const runtime = new ReactRouterRuntime({
        loggers: [new NoopLogger()]
    });

    const { result } = renderUseNavigationItemsByMenuHook(runtime);

    expect(result.current.size).toBe(0);
});

test.concurrent("returned Map is stable across renders until the registry changes", ({ expect }) => {
    const runtime = new ReactRouterRuntime({
        loggers: [new NoopLogger()]
    });

    runtime.registerNavigationItem({
        $label: "Foo",
        to: "/foo"
    });

    const { result, rerender } = renderUseNavigationItemsByMenuHook(runtime);

    const map1 = result.current;

    rerender();

    const map2 = result.current;

    runtime.registerNavigationItem({
        $label: "Bar",
        to: "/bar"
    }, {
        menuId: "other"
    });

    rerender();

    const map3 = result.current;

    expect(map1).toBe(map2);
    expect(map1).not.toBe(map3);
    expect(map3.size).toBe(2);
});
