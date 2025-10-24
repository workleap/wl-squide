import { describe, test } from "vitest";
import { RouteRegistry, createIndexKeys } from "../src/routeRegistry.ts";

describe("createIndexKey", () => {
    test.concurrent("when the route is an index route, return an empty array", ({ expect }) => {
        const result = createIndexKeys({
            index: true,
            element: <div>Hello!</div>
        });

        expect(result.length).toBe(0);
    });

    describe("absolute paths", () => {
        test.concurrent("when the route has a path, return the route path", ({ expect }) => {
            const result1 = createIndexKeys({
                path: "/nested",
                element: <div>Hello!</div>
            });

            expect(result1.length).toBe(1);
            expect(result1[0]).toBe("/nested");

            const result2 = createIndexKeys({
                path: "/parent/nested",
                element: <div>Hello!</div>
            });

            expect(result2.length).toBe(1);
            expect(result2[0]).toBe("/parent/nested");
        });

        test.concurrent("when the route has a path and the path has a trailing separator, strip the separator", ({ expect }) => {
            const result = createIndexKeys({
                path: "/parent/nested/",
                element: <div>Hello!</div>
            });

            expect(result.length).toBe(1);
            expect(result[0]).toBe("/parent/nested");
        });

        test.concurrent("when the route has a path and a parentPath is provided, ignore the parentPath", ({ expect }) => {
            const result1 = createIndexKeys({
                path: "/nested",
                element: <div>Hello!</div>
            }, "/parent");

            expect(result1.length).toBe(1);
            expect(result1[0]).toBe("/nested");
        });

        test.concurrent("when the route has a path and an $id, return an index key for both", ({ expect }) => {
            const result = createIndexKeys({
                $id: "nested-id",
                path: "/nested",
                element: <div>Hello!</div>
            });

            expect(result.length).toBe(2);
            expect(result[0]).toBe("/nested");
            expect(result[1]).toBe("nested-id");
        });
    });

    describe("relative paths", () => {
        test.concurrent("when the route has a path, return the route path", ({ expect }) => {
            const result1 = createIndexKeys({
                path: "nested",
                element: <div>Hello!</div>
            });

            expect(result1.length).toBe(1);
            expect(result1[0]).toBe("/nested");

            const result2 = createIndexKeys({
                path: "parent/nested",
                element: <div>Hello!</div>
            });

            expect(result2.length).toBe(1);
            expect(result2[0]).toBe("/parent/nested");
        });

        test.concurrent("when the route has a path and the path has a trailing separator, strip the separator", ({ expect }) => {
            const result = createIndexKeys({
                path: "parent/nested/",
                element: <div>Hello!</div>
            });

            expect(result.length).toBe(1);
            expect(result[0]).toBe("/parent/nested");
        });

        test.concurrent("when the route has a path and a parentPath is provided, prepend the parentPath", ({ expect }) => {
            const result1 = createIndexKeys({
                path: "nested",
                element: <div>Hello!</div>
            }, "/parent");

            expect(result1.length).toBe(1);
            expect(result1[0]).toBe("/parent/nested");

            const result2 = createIndexKeys({
                path: "nested",
                element: <div>Hello!</div>
            }, "parent");

            expect(result2.length).toBe(1);
            expect(result2[0]).toBe("/parent/nested");
        });

        test.concurrent("when the route has a path and the parentPath has a trailing separator, strip the separator", ({ expect }) => {
            const result = createIndexKeys({
                path: "nested",
                element: <div>Hello!</div>
            }, "parent/");

            expect(result.length).toBe(1);
            expect(result[0]).toBe("/parent/nested");
        });

        test.concurrent("when the route has a path and an $id, return an index key for both", ({ expect }) => {
            const result = createIndexKeys({
                $id: "nested-id",
                path: "nested",
                element: <div>Hello!</div>
            });

            expect(result.length).toBe(2);
            expect(result[0]).toBe("/nested");
            expect(result[1]).toBe("nested-id");
        });
    });

    test.concurrent("when the route has an $id, return the route $id", ({ expect }) => {
        const result = createIndexKeys({
            $id: "foo",
            element: <div>Hello!</div>
        });

        expect(result.length).toBe(1);
        expect(result[0]).toBe("foo");
    });

    test.concurrent("when this is a pathless route, return an empty array", ({ expect }) => {
        const result = createIndexKeys({
            element: <div>Hello!</div>
        });

        expect(result.length).toBe(0);
    });

    test.concurrent("when the route is pathless route and a parentPath is provided, return an empty array", ({ expect }) => {
        const result = createIndexKeys({
            element: <div>Hello!</div>
        }, "/parent");

        expect(result.length).toBe(0);
    });

    test.concurrent("when the route has an $id and a parentPath is provided, return the $id", ({ expect }) => {
        const result = createIndexKeys({
            $id: "nested",
            element: <div>Hello!</div>
        }, "parent");

        expect(result.length).toBe(1);
        expect(result[0]).toBe("nested");
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

        expect(result.completedPendingRegistrations[0].path).toBe("/root/another-level-1");
        expect(result.completedPendingRegistrations[1].path).toBe("/root/another-level-2");
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

        expect(result.completedPendingRegistrations.length).toBe(0);
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
            path: "/root/another-level/yet-another-level/another-level-1",
            element: <div>Hello</div>
        }, {
            parentPath: "/root/another-level/yet-another-level"
        });

        registry.add({
            path: "/root/another-level/yet-another-level/another-level-2",
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
            path: "/root/another-level/yet-another-level",
            element: <div>Hello</div>
        }, {
            parentPath: "/root"
        });

        expect(result.completedPendingRegistrations[0].path).toBe("/root/another-level/yet-another-level/another-level-1");
        expect(result.completedPendingRegistrations[1].path).toBe("/root/another-level/yet-another-level/another-level-2");
    });
});
