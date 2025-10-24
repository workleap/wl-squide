import { NoopLogger } from "@workleap/logging";
import { describe, test } from "vitest";
import { isProtectedRoutesOutletRoute, isPublicRoutesOutletRoute, ProtectedRoutes, ProtectedRoutesOutletId, PublicRoutes, PublicRoutesOutletId } from "../src/outlets.ts";
import { ReactRouterRuntime } from "../src/reactRouterRuntime.ts";
import type { Route } from "../src/routeRegistry.ts";

describe("registerRoute", () => {
    describe("outlets", () => {
        describe("PublicRoutes", () => {
            function registerPublicRoutesOutlet(runtime: ReactRouterRuntime) {
                runtime.registerRoute(PublicRoutes);
            }

            function getPublicRoutes(routes: Route[]): Route[] | undefined {
                for (const route of routes) {
                    if (isPublicRoutesOutletRoute(route)) {
                        return route.children!;
                    }

                    if (route.children) {
                        const publicRoutes = getPublicRoutes(route.children);

                        if (publicRoutes) {
                            return publicRoutes;
                        }
                    }
                }
            }

            test.concurrent("should register an index route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                registerPublicRoutesOutlet(runtime);

                runtime.registerRoute({
                    $visibility: "public",
                    index: true,
                    element: <div>Hello!</div>
                });

                const routes = getPublicRoutes(runtime.routes)!;

                expect(routes.length).toBe(1);
                expect(routes[0].index).toBeTruthy();
            });

            test.concurrent("should register a pathless route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                registerPublicRoutesOutlet(runtime);

                runtime.registerRoute({
                    $visibility: "public",
                    element: <div>Hello!</div>
                });

                const routes = getPublicRoutes(runtime.routes)!;

                expect(routes.length).toBe(1);
                expect(routes[0].index).toBeUndefined();
                expect(routes[0].path).toBeUndefined();
            });

            test.concurrent("should register multiple pathless routes", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                registerPublicRoutesOutlet(runtime);

                runtime.registerRoute({
                    $visibility: "public",
                    element: <div>Hello!</div>
                });

                runtime.registerRoute({
                    $visibility: "public",
                    element: <div>How</div>
                });

                runtime.registerRoute({
                    $visibility: "public",
                    element: <div>Are</div>
                });

                runtime.registerRoute({
                    $visibility: "public",
                    element: <div>You?</div>
                });

                const routes = getPublicRoutes(runtime.routes)!;

                expect(routes.length).toBe(4);
            });

            test.concurrent("when the public outlet is not registered, public route registrations are pending", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    $visibility: "public",
                    path: "/foo",
                    element: <div>Hello!</div>
                });

                expect(runtime.routes.length).toBe(0);
            });

            test.concurrent("when the public outlet is registered, pending public route registrations are completed", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    $visibility: "public",
                    path: "/foo",
                    element: <div>Hello!</div>
                });

                expect(runtime.routes.length).toBe(0);

                registerPublicRoutesOutlet(runtime);

                expect(runtime.routes.length).toBe(1);

                const routes = getPublicRoutes(runtime.routes)!;

                expect(routes.length).toBe(1);
                expect(routes[0].path).toBe("/foo");
            });

            test.concurrent("when the public outlet is registered, protected route registrations are still pending", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/foo",
                    element: <div>Hello!</div>
                });

                expect(runtime.routes.length).toBe(0);

                registerPublicRoutesOutlet(runtime);

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].$id).toBe(PublicRoutesOutletId);
            });
        });

        describe("ProtectedRoutes", () => {
            function registerProtectedRoutesOutlet(runtime: ReactRouterRuntime) {
                runtime.registerRoute(ProtectedRoutes);
            }

            function getProtectedRoutes(routes: Route[]): Route[] | undefined {
                for (const route of routes) {
                    if (isProtectedRoutesOutletRoute(route)) {
                        return route.children!;
                    }

                    if (route.children) {
                        const protectedRoutes = getProtectedRoutes(route.children);

                        if (protectedRoutes) {
                            return protectedRoutes;
                        }
                    }
                }
            }

            test.concurrent("should register an index route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                registerProtectedRoutesOutlet(runtime);

                runtime.registerRoute({
                    index: true,
                    element: <div>Hello!</div>
                });

                const routes = getProtectedRoutes(runtime.routes)!;

                expect(routes.length).toBe(1);
                expect(routes[0].index).toBeTruthy();
            });

            test.concurrent("should register a pathless route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                registerProtectedRoutesOutlet(runtime);

                runtime.registerRoute({
                    element: <div>Hello!</div>
                });

                const routes = getProtectedRoutes(runtime.routes)!;

                expect(routes.length).toBe(1);
                expect(routes[0].index).toBeUndefined();
                expect(routes[0].path).toBeUndefined();
            });

            test.concurrent("should register multiple pathless routes", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                registerProtectedRoutesOutlet(runtime);

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

                const routes = getProtectedRoutes(runtime.routes)!;

                expect(routes.length).toBe(4);
            });

            test.concurrent("when the protected outlet is not registered, protected route registrations are pending", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/foo",
                    element: <div>Hello!</div>
                });

                expect(runtime.routes.length).toBe(0);
            });

            test.concurrent("when the protected outlet is registered, pending protected route registrations are completed", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/foo",
                    element: <div>Hello!</div>
                });

                expect(runtime.routes.length).toBe(0);

                registerProtectedRoutesOutlet(runtime);

                expect(runtime.routes.length).toBe(1);

                const routes = getProtectedRoutes(runtime.routes)!;

                expect(routes.length).toBe(1);
                expect(routes[0].path).toBe("/foo");
            });

            test.concurrent("when the protected outlet is registered, public route registrations are still pending", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    $visibility: "public",
                    path: "/foo",
                    element: <div>Hello!</div>
                });

                expect(runtime.routes.length).toBe(0);

                registerProtectedRoutesOutlet(runtime);

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].$id).toBe(ProtectedRoutesOutletId);
            });
        });
    });

    describe("hoisted", () => {
        test.concurrent("should register an index route", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                index: true,
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].index).toBeTruthy();
        });

        test.concurrent("should register a pathless route", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].index).toBeUndefined();
            expect(runtime.routes[0].path).toBeUndefined();
        });

        test.concurrent("should register multiple pathless routes", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            runtime.registerRoute({
                element: <div>How</div>
            }, {
                hoist: true
            });

            runtime.registerRoute({
                element: <div>Are</div>
            }, {
                hoist: true
            });

            runtime.registerRoute({
                element: <div>You?</div>
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(4);
        });

        test.concurrent("should register a deeply nested route with pathless parent routes", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

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
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].path).toBe("/deeply-nested-route");
        });

        test.concurrent("should register a deeply nested index route with pathless parent routes", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

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
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].index).toBeTruthy();
        });

        test.concurrent("should register a root route with a \"public\" visibility", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                $visibility: "public",
                path: "/public",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes[0].path).toBe("/public");
            expect(runtime.routes[0].$visibility).toBe("public");
        });

        test.concurrent("should register a root route with a \"protected\" visibility", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                $visibility: "protected",
                path: "/protected",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes[0].path).toBe("/protected");
            expect(runtime.routes[0].$visibility).toBe("protected");
        });

        test.concurrent("when a root route has no visibility option, it is considered as an \"protected\" route", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/foo",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes[0].path).toBe("/foo");
            expect(runtime.routes[0].$visibility).toBe("protected");
        });

        test.concurrent("should register a nested route with a \"public\" visibility", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout",
                element: <div>Hello!</div>,
                children: [
                    {
                        $visibility: "public",
                        path: "/nested",
                        element: <div>Hello!</div>
                    }
                ]
            }, {
                hoist: true
            });

            expect(runtime.routes[0].children![0].path).toBe("/nested");
            expect(runtime.routes[0].children![0].$visibility).toBe("public");
        });

        test.concurrent("should register a nested route with a \"protected\" visibility", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout",
                element: <div>Hello!</div>,
                children: [
                    {
                        $visibility: "protected",
                        path: "/nested",
                        element: <div>Hello!</div>
                    }
                ]
            }, {
                hoist: true
            });

            expect(runtime.routes[0].children![0].path).toBe("/nested");
            expect(runtime.routes[0].children![0].$visibility).toBe("protected");
        });

        test.concurrent("when a nested route has no visibility option, it is considered as a \"protected\" route", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout",
                element: <div>Hello!</div>,
                children: [
                    {
                        path: "/nested",
                        element: <div>Hello!</div>
                    }
                ]
            }, {
                hoist: true
            });

            expect(runtime.routes[0].children![0].path).toBe("/nested");
            expect(runtime.routes[0].children![0].$visibility).toBe("protected");
        });

        test.concurrent("should register a root route with a name", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                $id: "foo",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].$id).toBe("foo");
        });

        test.concurrent("should register a nested route with a name", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                element: <div>Hello</div>,
                children: [
                    {
                        $id: "foo",
                        element: <div>You!</div>
                    }
                ]
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].$id).toBe("foo");
        });
    });

    describe("parentPath", () => {
        describe("absolute paths", () => {
            test.concurrent("when the parent route has already been registered, register the nested route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
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

                runtime.registerRoute({
                    path: "/layout/nested/another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout/nested"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].children![0].path).toBe("/layout/nested/another-nested");
            });

            test.concurrent("when the parent route has not been registered, do not register the nested route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(0);
            });

            test.concurrent("when the parent route has not been registered, register the pending route once the parent route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                runtime.registerRoute({
                    path: "/another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    path: "/foo",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children).toBeUndefined();

                runtime.registerRoute({
                    path: "/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(2);
                expect(runtime.routes[1].children?.length).toBe(2);
            });

            test.concurrent("when the parent route has not been registered, and the parent route is nested in a pending registration single block with multiple layers of relative paths, register the pending route once the parent route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/deeply/nested/layout/more-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout"
                });

                runtime.registerRoute({
                    path: "/deeply/nested/layout/more-nested/another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout/more-nested"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    path: "/deeply",
                    element: <div>Hello</div>,
                    children: [
                        {
                            path: "/deeply/nested",
                            element: <div>You!</div>,
                            children: [
                                {
                                    path: "/deeply/nested/layout",
                                    element: <div>Hello from nested!</div>
                                }
                            ]
                        }
                    ]
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].path).toBe("/deeply");
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("/deeply/nested/layout/more-nested");
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("/deeply/nested/layout/more-nested/another-nested");
            });

            test.concurrent("when the parent route has not been registered, and the parent route is nested in a pending registration single block, register the pending route once the parent route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/layout/nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                runtime.registerRoute({
                    path: "/layout/nested/another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout/nested"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
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
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].path).toBeUndefined();
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("/layout/nested");
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("/layout/nested/another-nested");
            });

            test.concurrent("should register a route under a deeply nested layout", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
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

            test.concurrent("should register a route under a deeply nested layout that has been registered in a single block with multiple layers of relative paths", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/deeply",
                    element: <div>Hello</div>,
                    children: [
                        {
                            path: "/deeply/nested",
                            element: <div>You!</div>,
                            children: [
                                {
                                    path: "/deeply/nested/layout",
                                    element: <div>Hello from nested!</div>
                                }
                            ]
                        }
                    ]
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "/deeply/nested/layout/another-level",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("/deeply/nested/layout/another-level");

                runtime.registerRoute({
                    path: "/deeply/nested/layout/another-level/yet-another-level",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout/another-level"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("/deeply/nested/layout/another-level/yet-another-level");
            });

            test.concurrent("should register a route under a deeply nested layout that has been registered in a single block", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
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
                }, {
                    hoist: true
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

            test.concurrent("when the specified parent path has a trailing separator but the parent route path doesn't have a trailing separator, the nested route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "/layout/nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout/"
                });

                expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
            });

            test.concurrent("when the specified parent path doesn't have a trailing separator but the parent route path have a trailing separator, the nested route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/layout/",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "/layout/nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
            });

            test.concurrent("when a parent route has a path and an $id, can register a nested route with the path", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    $id: "layout-id",
                    path: "/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "/layout/nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
            });

            test.concurrent("when a parent route has a path and an $id, pending registrations using the parent route path are registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/layout/nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    $id: "layout-id",
                    path: "/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
            });
        });

        describe("relative paths", () => {
            test.concurrent("when the parent route has already been registered, register the nested route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].path).toBe("nested");

                runtime.registerRoute({
                    path: "another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout/nested"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].children![0].path).toBe("another-nested");
            });

            test.concurrent("when the parent route has not been registered, do not register the nested route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(0);
            });

            test.concurrent("when the parent route has not been registered, register the pending route once the parent route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                runtime.registerRoute({
                    path: "another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    path: "foo",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children).toBeUndefined();

                runtime.registerRoute({
                    path: "layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(2);
                expect(runtime.routes[1].children?.length).toBe(2);
            });

            test.concurrent("when the parent route has not been registered, and the parent route is nested in a pending registration single block with multiple layers of relative paths, register the pending route once the parent route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "more-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout"
                });

                runtime.registerRoute({
                    path: "another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout/more-nested"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    path: "deeply",
                    element: <div>Hello</div>,
                    children: [
                        {
                            path: "nested",
                            element: <div>You!</div>,
                            children: [
                                {
                                    path: "layout",
                                    element: <div>Hello from nested!</div>
                                }
                            ]
                        }
                    ]
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].path).toBe("deeply");
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("more-nested");
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("another-nested");
            });

            test.concurrent("when the parent route has not been registered, and the parent route is nested in a pending registration single block, register the pending route once the parent route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                runtime.registerRoute({
                    path: "another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout/nested"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    element: <div>Hello</div>,
                    children: [
                        {
                            element: <div>You!</div>,
                            children: [
                                {
                                    path: "layout",
                                    element: <div>Hello from nested!</div>
                                }
                            ]
                        }
                    ]
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].path).toBeUndefined();
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("nested");
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("another-nested");
            });

            test.concurrent("should register a route under a deeply nested layout", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                runtime.registerRoute({
                    path: "another-level",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout/nested"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].children![0].path).toBe("another-level");
            });

            test.concurrent("should register a route under a deeply nested layout that has been registered in a single block with multiple layers of relative paths", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "deeply",
                    element: <div>Hello</div>,
                    children: [
                        {
                            path: "nested",
                            element: <div>You!</div>,
                            children: [
                                {
                                    path: "layout",
                                    element: <div>Hello from nested!</div>
                                }
                            ]
                        }
                    ]
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "another-level",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("another-level");

                runtime.registerRoute({
                    path: "yet-another-level",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout/another-level"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("yet-another-level");
            });

            test.concurrent("should register a route under a deeply nested layout that has been registered in a single block", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    element: <div>Hello</div>,
                    children: [
                        {
                            element: <div>You!</div>,
                            children: [
                                {
                                    path: "deeply-nested-layout",
                                    element: <div>Hello from nested!</div>
                                }
                            ]
                        }
                    ]
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "another-level",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply-nested-layout"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("another-level");

                runtime.registerRoute({
                    path: "yet-another-level",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply-nested-layout/another-level"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("yet-another-level");
            });

            test.concurrent("when the specified parent path has a trailing separator but the parent route path doesn't have a trailing separator, the nested route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout/"
                });

                expect(runtime.routes[0].children![0].path).toBe("nested");
            });

            test.concurrent("when the specified parent path doesn't have a trailing separator but the parent route path have a trailing separator, the nested route is registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "layout/",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes[0].children![0].path).toBe("nested");
            });

            test.concurrent("when a parent route has a path and an $id, can register a nested route with the path", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    $id: "layout-id",
                    path: "layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes[0].children![0].path).toBe("nested");
            });

            test.concurrent("when a parent route has a path and an $id, pending registrations using the parent route path are registered", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    $id: "layout-id",
                    path: "layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes[0].children![0].path).toBe("nested");
            });
        });

        describe("mixed absolute and relative paths", () => {
            test.concurrent("when the parent route has an absolute path, a child route with a relative path can be nested under the parent route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);

                runtime.registerRoute({
                    path: "nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].path).toBe("nested");
            });

            test.concurrent("when the parent route has a relative path, a child route with an absolute path can be nested under the parent route", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);

                runtime.registerRoute({
                    path: "/nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].path).toBe("/nested");
            });

            test.concurrent("when the parent route has a relative path, a child route can be nested under the parent route by providing a parentPath that doesn't start with a \"/\"", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);

                runtime.registerRoute({
                    path: "/nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/layout"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].children![0].path).toBe("/nested");
            });

            test.concurrent("when the parent route has been registered with single block with multiple layers of relative paths, register the nested routes with absolute paths", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "deeply",
                    element: <div>Hello</div>,
                    children: [
                        {
                            path: "nested",
                            element: <div>You!</div>,
                            children: [
                                {
                                    path: "layout",
                                    element: <div>Hello from nested!</div>
                                }
                            ]
                        }
                    ]
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "/deeply/nested/layout/more-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout"
                });

                runtime.registerRoute({
                    path: "/deeply/nested/layout/more-nested/another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout/more-nested"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].path).toBe("deeply");
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("/deeply/nested/layout/more-nested");
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("/deeply/nested/layout/more-nested/another-nested");
            });

            test.concurrent("when nested routes are registered in a single block with multiple layers of relative paths, register the nested routes under a parent route with an absolute path", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/deeply/nested/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                runtime.registerRoute({
                    path: "more-nested",
                    element: <div>Hello</div>,
                    children: [
                        {
                            path: "another-nested",
                            element: <div>You!</div>
                        }
                    ]
                }, {
                    parentPath: "/deeply/nested/layout"
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].path).toBe("/deeply/nested/layout");
                expect(runtime.routes[0].children![0].path).toBe("more-nested");
                expect(runtime.routes[0].children![0].children![0].path).toBe("another-nested");
            });

            test.concurrent("when the parent route has not been registered, and the parent route has an absolute path, and the nested routes are registered in a single block with multiple layers of relative paths, register the nested routes with relative paths", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "more-nested",
                    element: <div>Hello</div>,
                    children: [
                        {
                            path: "another-nested",
                            element: <div>You!</div>
                        }
                    ]
                }, {
                    parentPath: "/deeply/nested/layout"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    path: "/deeply/nested/layout",
                    element: <div>Hello!</div>
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].path).toBe("/deeply/nested/layout");
                expect(runtime.routes[0].children![0].path).toBe("more-nested");
                expect(runtime.routes[0].children![0].children![0].path).toBe("another-nested");
            });

            test.concurrent("when the parent route has not been registered, and the parent route is nested in a pending registration single block with multiple layers of relative paths, register the nested routes with absolute paths", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "/deeply/nested/layout/more-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout"
                });

                runtime.registerRoute({
                    path: "/deeply/nested/layout/more-nested/another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout/more-nested"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    path: "deeply",
                    element: <div>Hello</div>,
                    children: [
                        {
                            path: "nested",
                            element: <div>You!</div>,
                            children: [
                                {
                                    path: "layout",
                                    element: <div>Hello from nested!</div>
                                }
                            ]
                        }
                    ]
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].path).toBe("deeply");
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("/deeply/nested/layout/more-nested");
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("/deeply/nested/layout/more-nested/another-nested");
            });

            test.concurrent("when the parent route has not been registered, and the parent route is nested in a pending registration single block with multiple layers of absolute paths, register the nested routes with relative paths", ({ expect }) => {
                const runtime = new ReactRouterRuntime({
                    loggers: [new NoopLogger()]
                });

                runtime.registerRoute({
                    path: "more-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout"
                });

                runtime.registerRoute({
                    path: "another-nested",
                    element: <div>Hello!</div>
                }, {
                    parentPath: "/deeply/nested/layout/more-nested"
                });

                expect(runtime.routes.length).toBe(0);

                runtime.registerRoute({
                    path: "/deeply",
                    element: <div>Hello</div>,
                    children: [
                        {
                            path: "/deeply/nested",
                            element: <div>You!</div>,
                            children: [
                                {
                                    path: "/deeply/nested/layout",
                                    element: <div>Hello from nested!</div>
                                }
                            ]
                        }
                    ]
                }, {
                    hoist: true
                });

                expect(runtime.routes.length).toBe(1);
                expect(runtime.routes[0].path).toBe("/deeply");
                expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("more-nested");
                expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("another-nested");
            });
        });

        test.concurrent("when a route is hoisted, it cannot be nested under another route", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            expect(() => runtime.registerRoute({
                element: <div>Hello</div>
            }, {
                hoist: true,
                parentPath: "/foo"
            })).toThrow();
        });
    });

    describe("parentId", () => {
        test.concurrent("when the parent route has already been registered, register the nested route", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                $id: "layout",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);

            runtime.registerRoute({
                path: "/nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].path).toBe("/nested");
        });

        test.concurrent("when the parent route has not been registered, do not register the nested route", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout"
            });

            expect(runtime.routes.length).toBe(0);
        });

        test.concurrent("when the parent route has not been registered, register the pending route once the parent route is registered", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout" });

            runtime.registerRoute({
                path: "/another-nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout"
            });

            expect(runtime.routes.length).toBe(0);

            runtime.registerRoute({
                path: "/foo",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children).toBeUndefined();

            runtime.registerRoute({
                $id: "layout",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(2);
            expect(runtime.routes[1].children?.length).toBe(2);
        });

        test.concurrent("when the parent route has not been registered, and the parent route is nested in a pending registration single block, register the pending route once the parent route is registered", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout"
            });

            expect(runtime.routes.length).toBe(0);

            runtime.registerRoute({
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                $id: "layout",
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].path).toBeUndefined();
            expect(runtime.routes[0].children![0].children![0].children![0].path).toBe("/nested");
        });

        test.concurrent("should register a route under a deeply nested layout", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                $id: "layout",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            runtime.registerRoute({
                $id: "layout-nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout"
            });

            runtime.registerRoute({
                path: "/another-level",
                element: <div>Hello!</div>
            }, {
                parentId: "layout-nested"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].path).toBe("/another-level");
        });

        test.concurrent("should register a route under a deeply nested layout that has been registered in a single block", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                element: <div>Hello</div>,
                children: [
                    {
                        element: <div>You!</div>,
                        children: [
                            {
                                $id: "deeply-nested-layout",
                                element: <div>Hello from nested!</div>
                            }
                        ]
                    }
                ]
            }, {
                hoist: true
            });

            runtime.registerRoute({
                $id: "deeply-nested-layout/another-level",
                element: <div>Hello!</div>
            }, {
                parentId: "deeply-nested-layout"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].children![0].$id).toBe("deeply-nested-layout/another-level");

            runtime.registerRoute({
                path: "/deeply-nested-layout/another-level/yet-another-level",
                element: <div>Hello!</div>
            }, {
                parentId: "deeply-nested-layout/another-level"
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].children![0].children![0].path).toBe("/deeply-nested-layout/another-level/yet-another-level");
        });

        test.concurrent("when a route is hoisted, it cannot be nested under another route", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            expect(() => runtime.registerRoute({
                element: <div>Hello</div>
            }, {
                hoist: true,
                parentId: "foo"
            })).toThrow();
        });

        test.concurrent("when a parent route has a path and an $id, can register a nested route with the path", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                $id: "layout-id",
                path: "/layout",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout-id"
            });

            expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
        });

        test.concurrent("when a parent route has a path and an $id, pending registrations using the parent route path are registered", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout-id"
            });

            expect(runtime.routes.length).toBe(0);

            runtime.registerRoute({
                $id: "layout-id",
                path: "/layout",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
        });
    });

    describe("nested routes", () => {
        test.concurrent("should register a deeply nested route with pathless parent routes", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

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
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].path).toBe("/deeply-nested-route");
        });

        test.concurrent("should register a deeply nested index route with pathless parent routes", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

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
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].children![0].index).toBeTruthy();
        });

        test.concurrent("should register a nested route with a visibility hint", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout",
                element: <div>Hello!</div>,
                children: [
                    {
                        $visibility: "public",
                        path: "/layout/nested",
                        element: <div>Hello!</div>
                    }
                ]
            }, {
                hoist: true
            });

            expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
            expect(runtime.routes[0].children![0].$visibility).toBe("public");
        });

        test.concurrent("when a nested route has no visibility option, the visibility is defaulted to \"protected\"", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout",
                element: <div>Hello!</div>,
                children: [
                    {
                        path: "/layout/nested",
                        element: <div>Hello!</div>
                    }
                ]
            }, {
                hoist: true
            });

            expect(runtime.routes[0].children![0].path).toBe("/layout/nested");
            expect(runtime.routes[0].children![0].$visibility).toBe("protected");
        });

        test.concurrent("should register a nested route with a name", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                element: <div>Hello</div>,
                children: [
                    {
                        $id: "foo",
                        element: <div>You!</div>
                    }
                ]
            }, {
                hoist: true
            });

            expect(runtime.routes.length).toBe(1);
            expect(runtime.routes[0].children![0].$id).toBe("foo");
        });
    });

    test.concurrent("should register a route with a visibility hint", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerRoute({
            $visibility: "public",
            path: "/public",
            element: <div>Hello!</div>
        }, {
            hoist: true
        });

        expect(runtime.routes.length).toBe(1);
        expect(runtime.routes[0].path).toBe("/public");
        expect(runtime.routes[0].$visibility).toBe("public");
    });

    test.concurrent("when a route has no visibility option, the visibility is defaulted to \"protected\"", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerRoute({
            path: "/foo",
            element: <div>Hello!</div>
        }, {
            hoist: true
        });

        expect(runtime.routes.length).toBe(1);
        expect(runtime.routes[0].path).toBe("/foo");
        expect(runtime.routes[0].$visibility).toBe("protected");
    });

    test.concurrent("should register a route with a name", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerRoute({
            $id: "foo",
            element: <div>Hello!</div>
        }, {
            hoist: true
        });

        expect(runtime.routes.length).toBe(1);
        expect(runtime.routes[0].$id).toBe("foo");
    });

    test.concurrent("when a route is registered with the same value for the path and $id, throw an error", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        expect(() => {
            runtime.registerRoute({
                $id: "/layout",
                path: "/layout",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });
        }).toThrow();
    });
});

describe("registerNavigationItem", () => {
    test.concurrent("should register a root navigation link", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Root",
            to: "/root"
        });

        expect(runtime.getNavigationItems()[0].to).toBe("/root");
    });

    test.concurrent("should register a root navigation section", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Section",
            children: [
                {
                    $label: "Child",
                    to: "/child"
                }
            ]
        });

        expect(runtime.getNavigationItems()[0].$label).toBe("Section");
    });

    test.concurrent("should register a navigation link for a specific menu id", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Link",
            to: "/link"
        }, {
            menuId: "link-menu"
        });

        expect(runtime.getNavigationItems({ menuId: "link-menu" })[0].to).toBe("/link");
    });

    test.concurrent("should register a navigation section for a specific menu id", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Section",
            children: [
                {
                    $label: "Child",
                    to: "/child"
                }
            ]
        }, {
            menuId: "section-menu"
        });

        expect(runtime.getNavigationItems({ menuId: "section-menu" })[0].$label).toBe("Section");
    });

    test.concurrent("should register a navitation link with a key", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $id: "link",
            $label: "Link",
            to: "/link"
        });

        expect(runtime.getNavigationItems()[0].$id).toBe("link");
    });

    test.concurrent("should register a navitation section with a key", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $id: "section",
            $label: "Section",
            children: []
        });

        expect(runtime.getNavigationItems()[0].$id).toBe("section");
    });

    describe("sectionId", () => {
        test.concurrent("when the section has already been registered, register the nested item", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "section"
            });

            expect(runtime.getNavigationItems()[0].$id).toBe("section");
            expect(runtime.getNavigationItems()[0].children![0].$label).toBe("Link");
        });

        test.concurrent("when the section has not been registered, do not register the nested item", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "section"
            });

            expect(runtime.getNavigationItems().length).toBe(0);
        });

        test.concurrent("when the section has not been registered, register the pending item once the section is registered", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "section"
            });

            expect(runtime.getNavigationItems().length).toBe(0);

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            expect(runtime.getNavigationItems()[0].$id).toBe("section");
            expect(runtime.getNavigationItems()[0].children![0].$label).toBe("Link");
        });

        test.concurrent("should register an item under a deeply nested section", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Root section",
                children: [
                    {
                        $label: "Nested section",
                        children: [
                            {
                                $id: "deeply-nested",
                                $label: "Deeply nested",
                                children: []
                            }
                        ]
                    }
                ]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "deeply-nested"
            });

            expect(runtime.getNavigationItems()[0].children![0].children![0].children![0].$label).toBe("Link");
        });

        test.concurrent("should register a nested link under a section in a specific menu", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                menuId: "foo",
                sectionId: "section"
            });

            expect(runtime.getNavigationItems().length).toBe(0);

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            }, {
                menuId: "foo"
            });

            expect(runtime.getNavigationItems({ menuId: "foo" })[0].$id).toBe("section");
            expect(runtime.getNavigationItems({ menuId: "foo" })[0].children![0].$label).toBe("Link");
        });

        test.concurrent("when a section is registered with the same id but for a different menu, do not register the nested item", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                menuId: "foo",
                sectionId: "section"
            });

            expect(runtime.getNavigationItems().length).toBe(0);

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            }, {
                menuId: "bar"
            });

            expect(runtime.getNavigationItems({ menuId: "foo" }).length).toBe(0);
            expect(runtime.getNavigationItems({ menuId: "bar" }).length).toBe(1);
            expect(runtime.getNavigationItems({ menuId: "bar" })[0].$id).toBe("section");
            expect(runtime.getNavigationItems({ menuId: "bar" })[0].children!.length).toBe(0);
        });
    });
});

describe("getNavigationItems", () => {
    test.concurrent("when no menu id is specified, returns all the registered navigation items for the root menu", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Item 1",
            to: "/item-1"
        });

        runtime.registerNavigationItem({
            $label: "Item 2",
            to: "/item-2"
        });

        runtime.registerNavigationItem({
            $label: "Item 3",
            to: "/item-3"
        });

        runtime.registerNavigationItem({
            $label: "Item 4",
            to: "/item-4"
        }, {
            menuId: "menu-1"
        });

        runtime.registerNavigationItem({
            $label: "Item 5",
            to: "/item-5"
        }, {
            menuId: "menu-2"
        });

        expect(runtime.getNavigationItems()[0].to).toBe("/item-1");
        expect(runtime.getNavigationItems()[1].to).toBe("/item-2");
        expect(runtime.getNavigationItems()[2].to).toBe("/item-3");
    });

    test.concurrent("when no menu id is specified, returns all the registered navigation items for that specific menu", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Item 1",
            to: "/item-1"
        });

        runtime.registerNavigationItem({
            $label: "Item 2",
            to: "/item-2"
        });

        runtime.registerNavigationItem({
            $label: "Item 3",
            to: "/item-3"
        });

        runtime.registerNavigationItem({
            $label: "Item 4",
            to: "/item-4"
        }, {
            menuId: "menu-1"
        });

        runtime.registerNavigationItem({
            $label: "Item 5",
            to: "/item-5"
        }, {
            menuId: "menu-2"
        });

        expect(runtime.getNavigationItems({ menuId: "menu-1" })[0].to).toBe("/item-4");
    });
});

describe("startDeferredRegistrationScope & completeDeferredRegistrationScope", () => {
    test.concurrent("should start and complete a scope", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        expect(() => {
            runtime.startDeferredRegistrationScope();
            runtime.completeDeferredRegistrationScope();
        }).not.toThrow();
    });

    test.concurrent("when a scope is started, can register a navigation item", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.startDeferredRegistrationScope();

        runtime.registerNavigationItem({
            $label: "Foo",
            to: "foo"
        });

        expect(runtime.getNavigationItems().length).toBe(1);

        runtime.completeDeferredRegistrationScope();

        expect(runtime.getNavigationItems().length).toBe(1);
    });

    test.concurrent("when a scope is started, can register a route", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.startDeferredRegistrationScope();

        runtime.registerRoute({
            path: "/foo",
            element: <div>Hello!</div>
        }, {
            hoist: true
        });

        expect(runtime.routes.length).toBe(1);

        runtime.completeDeferredRegistrationScope();

        expect(runtime.routes.length).toBe(1);
    });

    test.concurrent("when a scope is completed, can register a navigation item", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.startDeferredRegistrationScope();

        runtime.registerNavigationItem({
            $label: "Foo",
            to: "foo"
        });

        expect(runtime.getNavigationItems().length).toBe(1);

        runtime.completeDeferredRegistrationScope();

        runtime.registerNavigationItem({
            $label: "Bar",
            to: "bar"
        });

        expect(runtime.getNavigationItems().length).toBe(2);
    });

    test.concurrent("when a scope is completed, can register a route", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.startDeferredRegistrationScope();

        runtime.registerRoute({
            path: "/foo",
            element: <div>Hello!</div>
        }, {
            hoist: true
        });

        expect(runtime.routes.length).toBe(1);

        runtime.completeDeferredRegistrationScope();

        runtime.registerRoute({
            path: "/bar",
            element: <div>Hello!</div>
        }, {
            hoist: true
        });

        expect(runtime.routes.length).toBe(2);
    });
});

describe("_validateRegistrations", () => {
    describe("managed routes", () => {
        test.concurrent("when public routes are registered but the public routes outlet is missing, the error message mentions the PublicRoutes outlet", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            let errorMessage;

            runtime.registerRoute({
                children: [
                    ProtectedRoutes
                ]
            }, {
                hoist: true
            });

            runtime.registerPublicRoute({
                path: "/public",
                element: <div>Hello!</div>
            });

            try {
                runtime._validateRegistrations();
            } catch (error: unknown) {
                errorMessage = (error as Error).message;
            }

            expect(errorMessage).toContain("PublicRoutes");
        });

        test.concurrent("when protected routes are registered but the protected routes outlet is missing, the error message mentions the ProtectedRoutes outlet", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            let errorMessage;

            runtime.registerRoute({
                children: [
                    PublicRoutes
                ]
            }, {
                hoist: true
            });

            runtime.registerRoute({
                path: "/protected",
                element: <div>Hello!</div>
            });

            try {
                runtime._validateRegistrations();
            } catch (error: unknown) {
                errorMessage = (error as Error).message;
            }

            expect(errorMessage).toContain("ProtectedRoutes");
        });

        test.concurrent("when routes are registered and both the public and protected routes outlet are missing, the error message mentions the PublicRoutes and ProtectedRoutes outlets", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            let errorMessage;

            runtime.registerPublicRoute({
                path: "/public",
                element: <div>Hello!</div>
            });

            runtime.registerRoute({
                path: "/protected",
                element: <div>Hello!</div>
            });

            try {
                runtime._validateRegistrations();
            } catch (error: unknown) {
                errorMessage = (error as Error).message;
            }

            expect(errorMessage).toContain("PublicRoutes");
            expect(errorMessage).toContain("ProtectedRoutes");
        });
    });

    describe("parentPath", () => {
        test.concurrent("when there are no pending registrations, do nothing", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            runtime.registerRoute({
                path: "/layout",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(() => runtime._validateRegistrations()).not.toThrow();
        });

        test.concurrent("when there are pending registrations, throw an error", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/layout"
            });

            expect(() => runtime._validateRegistrations()).toThrow();
        });
    });

    describe("parentId", () => {
        test.concurrent("when there are no pending registrations, do nothing", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout"
            });

            runtime.registerRoute({
                $id: "layout",
                element: <div>Hello!</div>
            }, {
                hoist: true
            });

            expect(() => runtime._validateRegistrations()).not.toThrow();
        });

        test.concurrent("when there are pending registrations, throw an error", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerRoute({
                path: "/layout/nested",
                element: <div>Hello!</div>
            }, {
                parentId: "layout"
            });

            expect(() => runtime._validateRegistrations()).toThrow();
        });
    });

    describe("sectionId", () => {
        test.concurrent("when there are no pending registrations, do nothing", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "section"
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            expect(() => runtime._validateRegistrations()).not.toThrow();
        });

        test.concurrent("when there are pending registrations, throw an error", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "section"
            });

            expect(() => runtime._validateRegistrations()).toThrow();
        });
    });
});
