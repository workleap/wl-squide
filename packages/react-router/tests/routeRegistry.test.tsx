import { describe, test } from "vitest";
import { RouteRegistry, createIndexKey } from "../src/routeRegistry.ts";

describe("createIndexKey", () => {
    test.concurrent("when the route is an index route, return undefined", ({ expect }) => {
        const result = createIndexKey({
            index: true,
            element: <div>Hello!</div>
        });

        expect(result).toBeUndefined();
    });

    test.concurrent("when the route has a path, return the route path", ({ expect }) => {
        const result1 = createIndexKey({
            path: "/nested",
            element: <div>Hello!</div>
        });

        expect(result1).toBe("/nested");

        const result2 = createIndexKey({
            path: "/parent/nested",
            element: <div>Hello!</div>
        });

        expect(result2).toBe("/parent/nested");
    });

    test.concurrent("when the route has a path and the path has a trailing separator, strip the separator", ({ expect }) => {
        const result = createIndexKey({
            path: "/parent/nested/",
            element: <div>Hello!</div>
        });

        expect(result).toBe("/parent/nested");
    });

    test.concurrent("when the route has a name, return the route name", ({ expect }) => {
        const result = createIndexKey({
            $id: "foo",
            element: <div>Hello!</div>
        });

        expect(result).toBe("foo");
    });

    test.concurrent("when this a pathless route, return undefined", ({ expect }) => {
        const result = createIndexKey({
            element: <div>Hello!</div>
        });

        expect(result).toBeUndefined();
    });

    test.concurrent("when the route is an index route and a parentPath is provided, return undefined", ({ expect }) => {
        const result = createIndexKey({
            element: <div>Hello!</div>
        }, "/parent");

        expect(result).toBeUndefined();
    });

    test.concurrent("when the route has a path and a parentPath is provided, append the parentPath to the route path", ({ expect }) => {
        const result1 = createIndexKey({
            path: "/nested",
            element: <div>Hello!</div>
        }, "/parent");

        expect(result1).toBe("/parent/nested");

        const result2 = createIndexKey({
            path: "nested",
            element: <div>Hello!</div>
        }, "/parent");

        expect(result2).toBe("/parent/nested");

        const result3 = createIndexKey({
            path: "nested",
            element: <div>Hello!</div>
        }, "parent");

        expect(result3).toBe("parent/nested");
    });

    test.concurrent("when the route has a path and the parentPath has a trailing separator, strip the separator", ({ expect }) => {
        const result = createIndexKey({
            path: "/nested",
            element: <div>Hello!</div>
        }, "/parent/");

        expect(result).toBe("/parent/nested");
    });

    test.concurrent("when the route path has a trailing separator and a parentPath is provided, strip the separator", ({ expect }) => {
        const result = createIndexKey({
            path: "/nested",
            element: <div>Hello!</div>
        }, "/parent");

        expect(result).toBe("/parent/nested");
    });
});

describe("add", () => {
    test.concurrent("when a root route is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new RouteRegistry();

        const result = registry.add({
            path: "/root",
            element: <div>Hello</div>
        }, {
            hoist: true
        });

        expect(result.registrationStatus).toBe("registered");
    });

    test.concurrent("when a root route is added and completes the pending registration of nested routes, add the registered routes to the returned \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new RouteRegistry();

        registry.add({
            path: "/root/another-level-1",
            element: <div>Hello</div>
        }, {
            parentPath: "/root"
        });

        registry.add({
            path: "/root/another-level-2",
            element: <div>Hello</div>
        }, {
            parentPath: "/root"
        });

        const result = registry.add({
            path: "/root",
            element: <div>Hello</div>
        }, {
            hoist: true
        });

        expect(result.completedPendingRegistrations![0].path).toBe("/root/another-level-1");
        expect(result.completedPendingRegistrations![1].path).toBe("/root/another-level-2");
    });

    test.concurrent("when a root route is added and do not complete any pending registration, return an empty \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new RouteRegistry();

        registry.add({
            path: "/root/another-level-1",
            element: <div>Hello</div>
        }, {
            parentPath: "/root"
        });

        registry.add({
            path: "/root/another-level-2",
            element: <div>Hello</div>
        }, {
            parentPath: "/root"
        });

        const result = registry.add({
            path: "/toto",
            element: <div>Hello</div>
        }, {
            hoist: true
        });

        expect(result.completedPendingRegistrations!.length).toBe(0);
    });

    test.concurrent("when a nested route is pending for registration, return the \"pending\" registration status", ({ expect }) => {
        const registry = new RouteRegistry();

        const result = registry.add({
            path: "/root/another-level",
            element: <div>Hello</div>
        }, {
            parentPath: "/root"
        });

        expect(result.registrationStatus).toBe("pending");
    });

    test.concurrent("when a nested route is added, return the \"registered\" registration status", ({ expect }) => {
        const registry = new RouteRegistry();

        registry.add({
            path: "/root",
            element: <div>Hello</div>
        }, {
            hoist: true
        });

        const result = registry.add({
            path: "/root/another-level",
            element: <div>Hello</div>
        }, {
            parentPath: "/root"
        });

        expect(result.registrationStatus).toBe("registered");
    });

    test.concurrent("when a nested route is added and completes the pending registration of nested routes, add the registered routes to the returned \"completedPendingRegistrations\" array", ({ expect }) => {
        const registry = new RouteRegistry();

        registry.add({
            path: "/another-level-1",
            element: <div>Hello</div>
        }, {
            parentPath: "/root/another-level/yet-another-level"
        });

        registry.add({
            path: "/another-level-2",
            element: <div>Hello</div>
        }, {
            parentPath: "/root/another-level/yet-another-level"
        });

        registry.add({
            path: "/root",
            element: <div>Hello</div>
        }, {
            hoist: true
        });

        const result = registry.add({
            path: "/another-level/yet-another-level",
            element: <div>Hello</div>
        }, {
            parentPath: "/root"
        });

        expect(result.completedPendingRegistrations![0].path).toBe("/another-level-1");
        expect(result.completedPendingRegistrations![1].path).toBe("/another-level-2");
    });
});

/*

Missing test cases:

- "should register a route under a deeply nested layout that has been registered in a single block with multiple layers of relative paths"

*/
