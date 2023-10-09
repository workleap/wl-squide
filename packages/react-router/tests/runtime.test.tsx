import type { RootRoute, Route } from "../src/routeRegistry.ts";
import { ManagedRoutes, Runtime, isManagedRoutesOutletRoute } from "../src/runtime.ts";

describe("registerRoute", () => {
    describe("managed routes", () => {
        function registerManagedRoutesOutlet(runtime: Runtime) {
            runtime.registerRoute(ManagedRoutes);
        }

        function getManagedRoutes(routes: Route[]): (Route | RootRoute)[] | undefined {
            for (const route of routes) {
                if (isManagedRoutesOutletRoute(route)) {
                    return route.children as Route[];
                }

                if (route.children) {
                    const managedRoutes = getManagedRoutes(route.children);

                    if (managedRoutes) {
                        return managedRoutes as Route[];
                    }
                }
            }
        }

        test("when the outlet is not registered, route registrations are pending", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/foo",
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(0);
        });

        test("when the outlet is registered, pending route registrations are completed", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/foo",
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(0);

            registerManagedRoutesOutlet(runtime);

            expect(runtime.routes.length).toBe(1);

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(1);
            expect(routes[0].path).toBe("/foo");
        });

        test("can register an index route", () => {
            const runtime = new Runtime();

            registerManagedRoutesOutlet(runtime);

            runtime.registerRoute({
                index: true,
                element: <div>Hello!</div>
            });

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(1);
            expect(routes[0].index).toBeTruthy();
        });

        test("can register a pathless route", () => {
            const runtime = new Runtime();

            registerManagedRoutesOutlet(runtime);

            runtime.registerRoute({
                element: <div>Hello!</div>
            });

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(1);
            expect(routes[0].index).toBeUndefined();
            expect(routes[0].path).toBeUndefined();
        });

        test("can register multiple pathless routes", () => {
            const runtime = new Runtime();

            registerManagedRoutesOutlet(runtime);

            runtime.registerRoute({
                element: <div>Hello!</div>
            });

            runtime.registerRoute({
                element: <div>How</div>
            });

            runtime.registerRoute({
                element: <div>Are</div>
            });

            runtime.registerRoute({
                element: <div>You?</div>
            });

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(4);
        });

        test("can register a deeply nested route with pathless parent routes", () => {
            const runtime = new Runtime();

            registerManagedRoutesOutlet(runtime);

            runtime.registerRoute({
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                path: "/deeply-nested-route",
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            });

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(1);
            expect(routes[0].children![0].children![0].path).toBe("/deeply-nested-route");
        });

        test("can register a deeply nested index route with pathless parent routes", () => {
            const runtime = new Runtime();

            registerManagedRoutesOutlet(runtime);

            runtime.registerRoute({
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                index: true,
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            });

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(1);
            expect(routes[0].children![0].children![0].index).toBeTruthy();
        });

        test("can register a route with a \"public\" visibility", () => {
            const runtime = new Runtime();

            registerManagedRoutesOutlet(runtime);

            runtime.registerRoute({
                path: "/public",
                element: <div>Hello!</div>,
                visibility: "public"
            });

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(1);
            expect(routes[0].path).toBe("/public");
            expect((routes[0] as RootRoute).visibility).toBe("public");
        });

        test("can register a route with a \"authenticated\" visibility", () => {
            const runtime = new Runtime();

            registerManagedRoutesOutlet(runtime);

            runtime.registerRoute({
                path: "/authenticated",
                element: <div>Hello!</div>,
                visibility: "authenticated"
            });

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(1);
            expect(routes[0].path).toBe("/authenticated");
            expect((routes[0] as RootRoute).visibility).toBe("authenticated");
        });

        test("can register a root route with a name", () => {
            const runtime = new Runtime();

            registerManagedRoutesOutlet(runtime);

            runtime.registerRoute({
                name: "foo",
                element: <div>Hello!</div>
            });

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(1);
            expect(routes[0].name).toBe("foo");
        });

        test("can register a nested route with a name", () => {
            const runtime = new Runtime();

            registerManagedRoutesOutlet(runtime);

            runtime.registerRoute({
                element: <div>Hello</div>,
                children: [
                    {
                        name: "foo",
                        element: <div>You!</div>
                    }
                ]
            });

            const routes = getManagedRoutes(runtime.routes)!;

            expect(routes.length).toBe(1);
            expect(routes[0].children![0].name).toBe("foo");
        });
    });

    describe("hoisted", () => {
        test("can register an index route", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                index: true,
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].index).toBeTruthy();
        });

        test("can register a pathless route", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].index).toBeUndefined();
            expect(runtime.routes[0].path).toBeUndefined();
        });

        test("can register multiple pathless routes", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                element: <div>Hello!</div>
            });

            runtime.registerRoute({
                hoist: true,
                element: <div>How</div>
            });

            runtime.registerRoute({
                hoist: true,
                element: <div>Are</div>
            });

            runtime.registerRoute({
                hoist: true,
                element: <div>You?</div>
            });

            expect(runtime.routes.length).toBe(4);
        });

        test("can register a deeply nested route with pathless parent routes", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                path: "/deeply-nested-route",
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].path).toBe("/deeply-nested-route");
        });

        test("can register a deeply nested index route with pathless parent routes", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                index: true,
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].index).toBeTruthy();
        });

        test("can register a route with a \"public\" visibility", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                path: "/public",
                element: <div>Hello!</div>,
                visibility: "public"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].path).toBe("/public");
            expect((runtime.routes[0] as RootRoute).visibility).toBe("public");
        });

        test("can register a route with a \"authenticated\" visibility", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                path: "/authenticated",
                element: <div>Hello!</div>,
                visibility: "authenticated"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].path).toBe("/authenticated");
            expect((runtime.routes[0] as RootRoute).visibility).toBe("authenticated");
        });

        test("can register a root route with a name", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                name: "foo",
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].name).toBe("foo");
        });

        test("can register a nested route with a name", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                element: <div>Hello</div>,
                children: [
                    {
                        name: "foo",
                        element: <div>You!</div>
                    }
                ]
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].name).toBe("foo");
        });
    });

    describe("parentPath", () => {
        test("when the parent route has already been registered, register the nested route", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                path: "/layout",
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(1);

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
        });

        test("when the parent route has not been registered, do not register the nested route", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            expect(runtime.routes.length).toBe(0);
        });

        test("when the parent route has not been registered, register the pending route once the parent route is registered", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            runtime.registerRoute({
                path: "/layout/another-nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            expect(runtime.routes.length).toBe(0);

            runtime.registerRoute({
                hoist: true,
                path: "/foo",
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children).toBeUndefined();

            runtime.registerRoute({
                hoist: true,
                path: "/layout",
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(2);
            expect(runtime.routes[1].children?.length).toBe(2);
        });

        test("when the parent route has not been registered, and the parent route is nested in a pending registration single block, register the pending route once the parent route is registered", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            expect(runtime.routes.length).toBe(0);

            runtime.registerRoute({
                hoist: true,
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                path: "/layout",
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].path).toBeUndefined();
            expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("/layout/nested");
        });

        test("can register a route under a deeply nested layout", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                path: "/layout",
                element: <div>Hello!</div>
            });

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            runtime.registerRoute({
                path: "/layout/nested/another-level",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout/nested"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].path).toBe("/layout/nested/another-level");
        });

        test("can register a route under a deeply nested layout that has been registered in a single block", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                path: "/deeply-nested-layout",
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            });

            runtime.registerRoute({
                path: "/deeply-nested-layout/another-level",
                element: <div>Hello!</div>
            }, {
                parentPath: "/deeply-nested-layout"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("/deeply-nested-layout/another-level");

            runtime.registerRoute({
                path: "/deeply-nested-layout/another-level/yet-another-level",
                element: <div>Hello!</div>
            }, {
                parentPath: "/deeply-nested-layout/another-level"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("/deeply-nested-layout/another-level/yet-another-level");
        });

        test("when the specified parent path has a trailing separator but the parent route path doesn't have a trailing separator, the nested route is registered", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                path: "/layout",
                element: <div>Hello!</div>
            });

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout/"
            });

            expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
        });

        test("when the specified parent path doesn't have a trailing separator but the parent route path have a trailing separator, the nested route is registered", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                path: "/layout/",
                element: <div>Hello!</div>
            });

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
        });

        test("when a route is hoisted, it cannot be nested under another route", () => {
            const runtime = new Runtime();

            expect(() => runtime.registerRoute({
                hoist: true,
                element: <div>Hello</div>
            }, {
                parentPath: "/foo"
            })).toThrow();
        });
    });

    describe("parentName", () => {
        test("when the parent route has already been registered, register the nested route", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                name: "layout",
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(1);

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentName: "layout"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
        });

        test("when the parent route has not been registered, do not register the nested route", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentName: "layout"
            });

            expect(runtime.routes.length).toBe(0);
        });

        test("when the parent route has not been registered, register the pending route once the parent route is registered", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentName: "layout" });

            runtime.registerRoute({
                path: "/layout/another-nested",
                element: <div>Hello!</div>
            }
            , {
                parentName: "layout"
            });

            expect(runtime.routes.length).toBe(0);

            runtime.registerRoute({
                hoist: true,
                path: "/foo",
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children).toBeUndefined();

            runtime.registerRoute({
                hoist: true,
                name: "layout",
                element: <div>Hello!</div>
            });

            expect(runtime.routes.length).toBe(2);
            expect(runtime.routes[1].children?.length).toBe(2);
        });

        test("when the parent route has not been registered, and the parent route is nested in a pending registration single block, register the pending route once the parent route is registered", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentName: "layout"
            });

            expect(runtime.routes.length).toBe(0);

            runtime.registerRoute({
                hoist: true,
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                name: "layout",
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].path).toBeUndefined();
            expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("/layout/nested");
        });

        test("can register a route under a deeply nested layout", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                name: "layout",
                element: <div>Hello!</div>
            });

            runtime.registerRoute({
                name: "layout-nested",
                element: <div>Hello!</div>
            }
            , {
                parentName: "layout"
            });

            runtime.registerRoute({
                path: "/layout/nested/another-level",
                element: <div>Hello!</div>
            }, {
                parentName: "layout-nested"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].path).toBe("/layout/nested/another-level");
        });

        test("can register a route under a deeply nested layout that has been registered in a single block", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                hoist: true,
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                name: "deeply-nested-layout",
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            });

            runtime.registerRoute({
                name: "deeply-nested-layout/another-level",
                element: <div>Hello!</div>
            }, {
                parentName: "deeply-nested-layout"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].children![0].name).toBe("deeply-nested-layout/another-level");

            runtime.registerRoute({
                path: "/deeply-nested-layout/another-level/yet-another-level",
                element: <div>Hello!</div>
            }, {
                parentName: "deeply-nested-layout/another-level"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("/deeply-nested-layout/another-level/yet-another-level");
        });

        test("when a route is hoisted, it cannot be nested under another route", () => {
            const runtime = new Runtime();

            expect(() => runtime.registerRoute({
                hoist: true,
                element: <div>Hello</div>
            }, {
                parentName: "foo"
            })).toThrow();
        });
    });
});

describe("registerNavigationItem", () => {
    test("can register a root navigation link", () => {
        const runtime = new Runtime();

        runtime.registerNavigationItem({
            to: "/root",
            label: "Root"
        });

        expect(runtime.getNavigationItems()[0].to).toBe("/root");
    });

    test("can register a root navigation section", () => {
        const runtime = new Runtime();

        runtime.registerNavigationItem({
            label: "Section",
            children: [
                {
                    to: "/child",
                    label: "Child"
                }
            ]
        });

        expect(runtime.getNavigationItems()[0].label).toBe("Section");
    });

    test("can register a navigation link for a specific menu id", () => {
        const runtime = new Runtime();

        runtime.registerNavigationItem({
            to: "/link",
            label: "Link"
        }, {
            menuId: "link-menu"
        });

        expect(runtime.getNavigationItems("link-menu")[0].to).toBe("/link");
    });

    test("can register a navigation section for a specific menu id", () => {
        const runtime = new Runtime();

        runtime.registerNavigationItem({
            label: "Section",
            children: [
                {
                    to: "/child",
                    label: "Child"
                }
            ]
        }, {
            menuId: "section-menu"
        });

        expect(runtime.getNavigationItems("section-menu")[0].label).toBe("Section");
    });
});

describe("getNavigationItems", () => {
    test("when no menu id is specified, returns all the registered navigation items for the root menu", () => {
        const runtime = new Runtime();

        runtime.registerNavigationItem({
            to: "/item-1",
            label: "Item 1"
        });

        runtime.registerNavigationItem({
            to: "/item-2",
            label: "Item 2"
        });

        runtime.registerNavigationItem({
            to: "/item-3",
            label: "Item 3"
        });

        runtime.registerNavigationItem({
            to: "/item-4",
            label: "Item 4"
        }, {
            menuId: "menu-1"
        });

        runtime.registerNavigationItem({
            to: "/item-5",
            label: "Item 5"
        }, {
            menuId: "menu-2"
        });

        expect(runtime.getNavigationItems()[0].to).toBe("/item-1");
        expect(runtime.getNavigationItems()[1].to).toBe("/item-2");
        expect(runtime.getNavigationItems()[2].to).toBe("/item-3");
    });

    test("when no menu id is specified, returns all the registered navigation items for that specific menu", () => {
        const runtime = new Runtime();

        runtime.registerNavigationItem({
            to: "/item-1",
            label: "Item 1"
        });

        runtime.registerNavigationItem({
            to: "/item-2",
            label: "Item 2"
        });

        runtime.registerNavigationItem({
            to: "/item-3",
            label: "Item 3"
        });

        runtime.registerNavigationItem({
            to: "/item-4",
            label: "Item 4"
        }, {
            menuId: "menu-1"
        });

        runtime.registerNavigationItem({
            to: "/item-5",
            label: "Item 5"
        }, {
            menuId: "menu-2"
        });

        expect(runtime.getNavigationItems("menu-1")[0].to).toBe("/item-4");
    });
});

describe("_completeRegistration", () => {
    describe("managed routes", () => {
        test("when the outlet is missing, the error message mentions the ManagedRoutes outlet", () => {
            const runtime = new Runtime();
            let errorMessage;

            runtime.registerRoute({
                path: "/layout",
                element: <div>Hello!</div>
            });

            try {
                runtime._completeRegistration();
            } catch (error: unknown) {
                errorMessage = (error as Error).message;
            }

            expect(errorMessage).toContain("ManagedRoutes");
        });
    });

    describe("parentPath", () => {
        test("when the registration is completed and there are no pending registrations, do nothing", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            runtime.registerRoute({
                hoist: true,
                path: "/layout",
                element: <div>Hello!</div>
            });

            expect(() => runtime._completeRegistration()).not.toThrow();
        });

        test("when the registration is completed and there are pending registrations, throw an error", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            expect(() => runtime._completeRegistration()).toThrow();
        });
    });

    describe("parentName", () => {
        test("when the registration is completed and there are no pending registrations, do nothing", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentName: "layout"
            });

            runtime.registerRoute({
                hoist: true,
                name: "layout",
                element: <div>Hello!</div>
            });

            expect(() => runtime._completeRegistration()).not.toThrow();
        });

        test("when the registration is completed and there are pending registrations, throw an error", () => {
            const runtime = new Runtime();

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentName: "layout"
            });

            expect(() => runtime._completeRegistration()).toThrow();
        });
    });
});
