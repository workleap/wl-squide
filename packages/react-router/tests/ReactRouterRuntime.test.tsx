import { NoopLogger } from "@workleap/logging";
import { describe, test } from "vitest";
import type { NavigationSection } from "../src/NavigationItemRegistry.ts";
import { isProtectedRoutesOutletRoute, isPublicRoutesOutletRoute, ProtectedRoutes, ProtectedRoutesOutletId, PublicRoutes, PublicRoutesOutletId } from "../src/outlets.ts";
import { ReactRouterRuntime } from "../src/ReactRouterRuntime.ts";
import type { Route } from "../src/RouteRegistry.ts";
import { RecordingLogger } from "./RecordingLogger.ts";

describe.concurrent("registerRoute", () => {
    describe.concurrent("outlets", () => {
        describe.concurrent("PublicRoutes", () => {
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

        describe.concurrent("ProtectedRoutes", () => {
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

    describe.concurrent("hoisted", () => {
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

    describe.concurrent("parentPath", () => {
        describe.concurrent("absolute paths", () => {
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

        describe.concurrent("relative paths", () => {
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

        describe.concurrent("mixed absolute and relative paths", () => {
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

    describe.concurrent("parentId", () => {
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

    describe.concurrent("nested routes", () => {
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

describe.concurrent("registerNavigationItem", () => {
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

    describe.concurrent("sectionId", () => {
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

        test.concurrent("when a menu id and a section id would collide once concatenated, do not attach the nested item to the other menu's section", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            // The "analytics" menu with the "sidebar-performance" section and the "analytics-sidebar" menu with
            // the "performance" section used to produce the same section index key, which attached the nested
            // item to whichever of the two sections had been registered first.
            runtime.registerNavigationItem({
                $id: "sidebar-performance",
                $label: "Performance",
                children: []
            }, {
                menuId: "analytics"
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                menuId: "analytics-sidebar",
                sectionId: "performance"
            });

            expect(runtime.getNavigationItems({ menuId: "analytics" })[0].children!.length).toBe(0);
            expect(runtime.getNavigationItems({ menuId: "analytics-sidebar" }).length).toBe(0);
        });

        test.concurrent("when a menu id and a section id would collide once concatenated, a pending nested item is not completed by the other menu's section", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                menuId: "analytics-sidebar",
                sectionId: "performance"
            });

            // Registering the colliding section used to complete the pending registration above into the
            // "analytics" menu. That also emptied the pending index, so the validation below stopped
            // reporting the section that is genuinely missing.
            runtime.registerNavigationItem({
                $id: "sidebar-performance",
                $label: "Performance",
                children: []
            }, {
                menuId: "analytics"
            });

            expect(runtime.getNavigationItems({ menuId: "analytics" })[0].children!.length).toBe(0);
            expect(runtime.getNavigationItems({ menuId: "analytics-sidebar" }).length).toBe(0);
            expect(() => runtime._validateRegistrations()).toThrow(/Missing navigation section "performance" of the "analytics-sidebar" menu/);
        });
    });
});

describe.concurrent("getNavigationItems", () => {
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

describe.concurrent("startDeferredRegistrationScope & completeDeferredRegistrationScope", () => {
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

    test.concurrent("when the completion of a scope throws an error, a new scope can be started", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.startDeferredRegistrationScope({ transactional: true });

        // Reading the children of the section throws, and the replay performed by the completion of the scope
        // is what reads them.
        const section = {
            $id: "section",
            $label: "Section"
        } as Record<string, unknown>;

        Object.defineProperty(section, "children", {
            get() {
                throw new Error("Cannot read the children of this section.");
            },
            enumerable: true,
            configurable: true
        });

        runtime.registerNavigationItem(section as never);

        expect(() => runtime.completeDeferredRegistrationScope()).toThrow();

        expect(() => runtime.startDeferredRegistrationScope({ transactional: true })).not.toThrow();
    });

    test.concurrent("when a transactional scope buffers an item, the registration is reported as buffered", ({ expect }) => {
        const logger = new RecordingLogger();

        const runtime = new ReactRouterRuntime({
            loggers: [logger]
        });

        runtime.startDeferredRegistrationScope({ transactional: true });

        runtime.registerNavigationItem({
            $label: "Link",
            to: "/link"
        });

        expect(logger.logs.some(x => x.includes("buffered"))).toBeTruthy();
        expect(logger.logs.some(x => x.includes("registered"))).toBeFalsy();
    });

    test.concurrent("when a transactional scope is completed and a section is missing, the nested item is reported as pending", ({ expect }) => {
        const logger = new RecordingLogger();

        const runtime = new ReactRouterRuntime({
            loggers: [logger]
        });

        runtime.startDeferredRegistrationScope({ transactional: true });

        runtime.registerNavigationItem({
            $label: "Link",
            to: "/link"
        }, {
            sectionId: "section"
        });

        runtime.completeDeferredRegistrationScope();

        // The replay adds the item straight to the registry. It used to log nothing at all, so an update run
        // that lost a nested item reported success and then said nothing.
        expect(logger.logs.some(x => x.includes("pending") && x.includes("section"))).toBeTruthy();
    });

    test.concurrent("when a transactional scope is completed, the replayed registrations are reported", ({ expect }) => {
        const logger = new RecordingLogger();

        const runtime = new ReactRouterRuntime({
            loggers: [logger]
        });

        runtime.startDeferredRegistrationScope({ transactional: true });

        runtime.registerNavigationItem({
            $id: "section",
            $label: "Section",
            children: []
        });

        runtime.completeDeferredRegistrationScope();

        expect(logger.logs.some(x => x.includes("registered"))).toBeTruthy();
    });

    test.concurrent("when a section is registered again by a deferred update run, the caller's object does not accumulate children", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        // Hoisting a section to module scope and registering the same object on every run is a natural
        // pattern. The registry used to attach the nested items to this very object, so its children grew by
        // one on every update run and the menu rendered the accumulated copies.
        const section: NavigationSection = {
            $id: "section",
            $label: "Section",
            children: []
        };

        const runUpdate = () => {
            runtime.startDeferredRegistrationScope({ transactional: true });

            runtime.registerNavigationItem(section);

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "section"
            });

            runtime.completeDeferredRegistrationScope();
        };

        runUpdate();
        runUpdate();
        runUpdate();

        expect(section.children.length).toBe(0);
        expect(runtime.getNavigationItems()[0].children!.length).toBe(1);
    });

    test.concurrent("when a deferred section is registered, its accessor properties stay lazy", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        let labelReadCount = 0;

        // Building the section with a spread would evaluate this getter at registration time and freeze its
        // result, which is why the property descriptors are copied instead.
        const section: NavigationSection = {
            $id: "section",
            get $label() {
                labelReadCount += 1;

                return "Section";
            },
            children: []
        };

        runtime.startDeferredRegistrationScope({ transactional: true });

        runtime.registerNavigationItem(section);

        runtime.completeDeferredRegistrationScope();

        expect(labelReadCount).toBe(0);
        expect(runtime.getNavigationItems()[0].$label).toBe("Section");
        expect(labelReadCount).toBe(1);
    });

    test.concurrent("when a deferred section holds nested sections, the caller's nested objects are not mutated either", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        const inner: NavigationSection = {
            $id: "inner",
            $label: "Inner",
            children: []
        };

        const outer: NavigationSection = {
            $id: "outer",
            $label: "Outer",
            children: [inner]
        };

        const runUpdate = () => {
            runtime.startDeferredRegistrationScope({ transactional: true });

            runtime.registerNavigationItem(outer);

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "inner"
            });

            runtime.completeDeferredRegistrationScope();
        };

        runUpdate();
        runUpdate();
        runUpdate();

        // Every section is built from its own registration, including the ones declared inline. Reusing the
        // caller's nested object would leave it shared with the registry, so it would accumulate exactly like
        // the outer one used to.
        expect(inner.children.length).toBe(0);
        expect(outer.children.length).toBe(1);
        expect(outer.children[0]).toBe(inner);

        const registeredOuter = runtime.getNavigationItems()[0];

        expect(registeredOuter.children!.length).toBe(1);
        expect(registeredOuter.children![0].children!.length).toBe(1);
    });

    test.concurrent("when a deferred section is frozen, it can still be registered", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        // The "children" descriptor is replaced rather than assigned to, otherwise a frozen section would
        // throw on every registration, including one that nothing nests under.
        const section = Object.freeze({
            $id: "section",
            $label: "Section",
            children: Object.freeze([]) as unknown as NavigationSection[]
        }) as NavigationSection;

        runtime.startDeferredRegistrationScope({ transactional: true });

        expect(() => runtime.registerNavigationItem(section)).not.toThrow();

        runtime.registerNavigationItem({
            $label: "Link",
            to: "/link"
        }, {
            sectionId: "section"
        });

        expect(() => runtime.completeDeferredRegistrationScope()).not.toThrow();

        expect(section.children.length).toBe(0);
        expect(runtime.getNavigationItems()[0].children!.length).toBe(1);
    });

    test.concurrent("when a deferred section is backed by a class instance, it keeps its prototype", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        class Section {
            $id = "section";
            children: NavigationSection[] = [];

            get $label() {
                return "Section";
            }
        }

        const section = new Section();

        runtime.startDeferredRegistrationScope({ transactional: true });

        runtime.registerNavigationItem(section as unknown as NavigationSection);

        runtime.completeDeferredRegistrationScope();

        expect(runtime.getNavigationItems()[0]).toBeInstanceOf(Section);
        expect(runtime.getNavigationItems()[0].$label).toBe("Section");
    });

    test.concurrent("when a static section is frozen, it can still be registered", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        // Every section is built from its registration, on the static path as well, therefore the frozen
        // section case is not specific to a deferred registration anymore.
        const section = Object.freeze({
            $id: "section",
            $label: "Section",
            children: Object.freeze([]) as unknown as NavigationSection[]
        }) as NavigationSection;

        expect(() => runtime.registerNavigationItem(section)).not.toThrow();

        runtime.registerNavigationItem({
            $label: "Link",
            to: "/link"
        }, {
            sectionId: "section"
        });

        expect(section.children.length).toBe(0);
        expect(runtime.getNavigationItems()[0].children!.length).toBe(1);
    });

    test.concurrent("when a static section is backed by a class instance, it keeps its prototype", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        class Section {
            $id = "section";
            children: NavigationSection[] = [];

            get $label() {
                return "Section";
            }
        }

        const section = new Section();

        runtime.registerNavigationItem(section as unknown as NavigationSection);

        expect(runtime.getNavigationItems()[0]).toBeInstanceOf(Section);
        expect(runtime.getNavigationItems()[0].$label).toBe("Section");
    });

    test.concurrent("when a section is registered, the registry never mutates the caller's object", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        // The items are built from the registrations rather than stored, therefore nesting an item under a
        // section never writes to the "children" array the module owns.
        const section: NavigationSection = {
            $id: "section",
            $label: "Section",
            children: []
        };

        runtime.registerNavigationItem(section);

        runtime.registerNavigationItem({
            $label: "Link",
            to: "/link"
        }, {
            sectionId: "section"
        });

        expect(section.children.length).toBe(0);
        expect((runtime.getNavigationItems()[0] as NavigationSection).children.length).toBe(1);
        expect(runtime.getNavigationItems()[0]).not.toBe(section);
        expect(runtime.getNavigationItems()[0].$id).toBe(section.$id);
    });
});

describe.concurrent("registerPublicRoute", () => {
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

    test.concurrent("should register a flat public route", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        registerPublicRoutesOutlet(runtime);

        runtime.registerPublicRoute({
            path: "/foo",
            element: <div>Hello!</div>
        });

        const routes = getPublicRoutes(runtime.routes)!;

        expect(routes.length).toBe(1);
        expect(routes[0].path).toBe("/foo");
        expect(routes[0].$visibility).toBe("public");
    });

    test.concurrent("when a child route has no visibility option, the child route is considered as a \"public\" route", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        registerPublicRoutesOutlet(runtime);

        runtime.registerPublicRoute({
            element: <div>Layout</div>,
            children: [
                {
                    path: "/foo",
                    element: <div>Foo</div>
                },
                {
                    path: "/bar",
                    element: <div>Bar</div>
                }
            ]
        });

        const routes = getPublicRoutes(runtime.routes)!;

        expect(routes[0].$visibility).toBe("public");
        expect(routes[0].children![0].$visibility).toBe("public");
        expect(routes[0].children![1].$visibility).toBe("public");
    });

    test.concurrent("should register a child route with an explicit visibility", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        registerPublicRoutesOutlet(runtime);

        runtime.registerPublicRoute({
            element: <div>Layout</div>,
            children: [
                {
                    $visibility: "protected",
                    path: "/protected-child",
                    element: <div>Protected</div>
                },
                {
                    path: "/public-child",
                    element: <div>Public</div>
                }
            ]
        });

        const routes = getPublicRoutes(runtime.routes)!;

        expect(routes[0].children![0].$visibility).toBe("protected");
        expect(routes[0].children![1].$visibility).toBe("public");
    });

    test.concurrent("when a deeply nested route has no visibility option, the deeply nested route is considered as a \"public\" route", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        registerPublicRoutesOutlet(runtime);

        runtime.registerPublicRoute({
            element: <div>Root</div>,
            children: [
                {
                    element: <div>Layout</div>,
                    children: [
                        {
                            path: "/reviews",
                            children: [
                                {
                                    index: true,
                                    element: <div>Index</div>
                                }
                            ]
                        },
                        {
                            path: "/reviews/auth-redirect",
                            element: <div>Auth</div>
                        }
                    ]
                }
            ]
        });

        const routes = getPublicRoutes(runtime.routes)!;

        expect(routes[0].$visibility).toBe("public");
        expect(routes[0].children![0].$visibility).toBe("public");
        expect(routes[0].children![0].children![0].$visibility).toBe("public");
        expect(routes[0].children![0].children![0].children![0].$visibility).toBe("public");
        expect(routes[0].children![0].children![1].$visibility).toBe("public");
    });
});

describe.concurrent("_validateRegistrations", () => {
    describe.concurrent("managed routes", () => {
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

    describe.concurrent("parentPath", () => {
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

    describe.concurrent("parentId", () => {
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

    describe.concurrent("sectionId", () => {
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

        test.concurrent("when the menu id and the section id contains dashes, the error message includes the actual ids", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                menuId: "analytics-sidebar",
                sectionId: "analytics-performance"
            });

            expect(() => runtime._validateRegistrations()).toThrow(/Missing navigation section "analytics-performance" of the "analytics-sidebar" menu/);
        });

        test.concurrent("when two missing sections would collide once concatenated, the error message reports both", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            // Both pending registrations used to share a single index key, which reported a single missing
            // section instead of the two distinct ones that are actually missing.
            runtime.registerNavigationItem({
                $label: "Link 1",
                to: "/link-1"
            }, {
                menuId: "analytics",
                sectionId: "sidebar-performance"
            });

            runtime.registerNavigationItem({
                $label: "Link 2",
                to: "/link-2"
            }, {
                menuId: "analytics-sidebar",
                sectionId: "performance"
            });

            expect(() => runtime._validateRegistrations()).toThrow(/2 navigation sections were expected to be registered but are missing/);
            expect(() => runtime._validateRegistrations()).toThrow(/Missing navigation section "sidebar-performance" of the "analytics" menu/);
            expect(() => runtime._validateRegistrations()).toThrow(/Missing navigation section "performance" of the "analytics-sidebar" menu/);
        });

        test.concurrent("when the runtime is in production mode, the report is logged rather than thrown", ({ expect }) => {
            const logger = new RecordingLogger();

            const runtime = new ReactRouterRuntime({
                mode: "production",
                loggers: [logger]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "section"
            });

            expect(() => runtime._validateRegistrations()).not.toThrow();

            // Not throwing is only half of the contract, production has to still say what is missing.
            expect(logger.logs.some(x => x.includes("Missing navigation section \"section\""))).toBeTruthy();
        });
    });

    describe.concurrent("duplicate section declarations", () => {
        test.concurrent("when a section is declared twice identically, nothing is reported", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            // Declaring a section that no module owns from every module contributing to it is the supported
            // pattern, reporting it would make strict mode noisy for correct code.
            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            expect(() => runtime._validateRegistrations()).not.toThrow();
        });

        test.concurrent("when an ignored declaration carries children, the report says how many", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: [{
                    $id: "link",
                    $label: "Link",
                    to: "/link"
                }]
            });

            expect(() => runtime._validateRegistrations()).toThrow(/Navigation section "section" of the "root" menu/);
            expect(() => runtime._validateRegistrations()).toThrow(/A static declaration with 1 child/);
        });

        test.concurrent("when an ignored declaration carries a $priority, the report says which", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                $priority: 10,
                children: []
            });

            expect(() => runtime._validateRegistrations()).toThrow(/a "\$priority" option of 10/);
        });

        test.concurrent("when an ignored declaration carries a sectionId, the report says which", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "holder",
                $label: "Holder",
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            // The section is already registered at the root of the menu, therefore this declaration is
            // deduplicated rather than nested under the "holder" section as it asked to be.
            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            }, {
                sectionId: "holder"
            });

            expect(() => runtime._validateRegistrations()).toThrow(/a "sectionId" option of "holder"/);
        });

        test.concurrent("when a shared section is declared with the same $priority everywhere, nothing is reported", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            // The registered section already carries that priority, so this declaration discards nothing.
            // Reporting the option's presence would make the supported pattern unusable for a prioritized
            // section, since the documentation asks every module to declare it identically.
            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                $priority: 10,
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                $priority: 10,
                children: []
            });

            expect(() => runtime._validateRegistrations()).not.toThrow();
        });

        test.concurrent("when a shared section is declared with the same sectionId everywhere, nothing is reported", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "admin",
                $label: "Admin",
                children: []
            });

            // The registered section is already nested under "admin", which is where this declaration asked
            // to be. A shared subsection can only be declared this way.
            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            }, {
                sectionId: "admin"
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            }, {
                sectionId: "admin"
            });

            expect(() => runtime._validateRegistrations()).not.toThrow();
        });

        test.concurrent("when a declaration is registered but did not get the identifier, it is reported as such", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            // Waiting for a section that is registered below, therefore this one only competes for the
            // "section" identifier once it takes its place in the menu, and it loses. It is still rendered
            // where it was registered, which is why it is not reported as an ignored declaration.
            runtime.registerNavigationItem({
                $id: "section",
                $label: "Another section",
                children: []
            }, {
                sectionId: "holder"
            });

            runtime.registerNavigationItem({
                $id: "holder",
                $label: "Holder",
                children: []
            });

            expect(() => runtime._validateRegistrations()).toThrow(/Declarations that are registered but do not own the identifier/);
            expect(() => runtime._validateRegistrations()).toThrow(/A static declaration nested under the "holder" section/);
            expect(runtime.getNavigationItems().length).toBe(2);
        });

        test.concurrent("when a declaration is registered but did not get the identifier, it is reported even without conflicting options", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            }, {
                sectionId: "holder"
            });

            runtime.registerNavigationItem({
                $id: "holder",
                $label: "Holder",
                children: []
            });

            // Two sections of the same menu answering to the same identifier is never intended, unlike a
            // declaration that merely lost, therefore it is reported whatever it carries.
            expect(() => runtime._validateRegistrations()).toThrow(/Declarations that are registered but do not own the identifier/);
        });

        test.concurrent("the report counts sections rather than declarations", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            ["first", "second"].forEach(x => {
                runtime.registerNavigationItem({
                    $id: x,
                    $label: x,
                    children: []
                });

                runtime.registerNavigationItem({
                    $id: x,
                    $label: x,
                    $priority: 10,
                    children: []
                });

                runtime.registerNavigationItem({
                    $id: x,
                    $label: x,
                    $priority: 20,
                    children: []
                });
            });

            expect(() => runtime._validateRegistrations()).toThrow(/2 navigation sections have been declared more than once/);
        });

        test.concurrent("when the runtime is in production mode, the report is logged rather than thrown", ({ expect }) => {
            const logger = new RecordingLogger();

            const runtime = new ReactRouterRuntime({
                mode: "production",
                loggers: [logger]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                $priority: 10,
                children: []
            });

            expect(() => runtime._validateRegistrations()).not.toThrow();

            // Not throwing is only half of the contract, production has to still say what has been ignored.
            expect(logger.logs.some(x => x.includes("Navigation section \"section\" of the \"root\" menu"))).toBeTruthy();
        });

        test.concurrent("when a deferred declaration is ignored, it is not reported again after the run is cleared", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            // A deferred declaration belongs to the run that made it. Keeping it would report the declarations
            // of every run that ever happened, growing by one on every feature flag flip.
            for (let i = 0; i < 3; i++) {
                runtime.startDeferredRegistrationScope({ transactional: true });

                runtime.registerNavigationItem({
                    $id: "section",
                    $label: "Section",
                    $priority: 10,
                    children: []
                });

                runtime.completeDeferredRegistrationScope();
            }

            let errorMessage = "";

            try {
                runtime._validateRegistrations();
            } catch (error: unknown) {
                errorMessage = (error as Error).message;
            }

            expect(errorMessage).toContain("a \"$priority\" option of 10");
            expect(errorMessage.match(/a "\$priority" option of 10/g)?.length).toBe(1);
        });

        test.concurrent("when a registered declaration did not get the identifier, it is not reported again after a run is cleared", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            }, {
                sectionId: "holder"
            });

            runtime.registerNavigationItem({
                $id: "holder",
                $label: "Holder",
                children: []
            });

            // This declaration is recorded while the section is being indexed rather than by the registration
            // that declared it, and every update run indexes it again. Keeping it would add a bullet to the
            // report on every feature flag flip, for the life of the session.
            for (let i = 0; i < 3; i++) {
                runtime.startDeferredRegistrationScope({ transactional: true });

                runtime.registerNavigationItem({
                    $label: "Deferred",
                    to: "/deferred"
                });

                runtime.completeDeferredRegistrationScope();
            }

            let errorMessage = "";

            try {
                runtime._validateRegistrations();
            } catch (error: unknown) {
                errorMessage = (error as Error).message;
            }

            expect(errorMessage).toContain("A static declaration nested under the \"holder\" section");
            expect(errorMessage.match(/A static declaration nested under the "holder" section/g)?.length).toBe(1);
        });

        test.concurrent("when an ignored declaration was written inline in another section, the report says where", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            // The inline declaration is dropped from the position it was written in, together with everything
            // declared under it, which the identical declaration of a shared section doesn't lose. The label is
            // the same one on purpose, otherwise the report would be triggered by the label instead.
            runtime.registerNavigationItem({
                $id: "reports",
                $label: "Reports",
                children: [{
                    $id: "section",
                    $label: "Section",
                    children: []
                }]
            });

            expect(() => runtime._validateRegistrations()).toThrow(/declared inline in the "reports" section/);
        });

        test.concurrent("when an ignored declaration was written inline in a section without an identifier, the report does not name it", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            runtime.registerNavigationItem({
                $label: "Reports",
                children: [{
                    $id: "section",
                    $label: "Section",
                    children: []
                }]
            });

            expect(() => runtime._validateRegistrations()).toThrow(/declared inline in another section/);
        });

        test.concurrent("when the section an ignored declaration was written in does not own its identifier, the report does not name it", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "reports",
                $label: "Reports",
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Section",
                children: []
            });

            // This one keeps its place under "holder" but loses the "reports" identifier, so naming it as the
            // section the inline declaration was written in would address a section the reader cannot find:
            // "reports" resolves to the one registered above.
            runtime.registerNavigationItem({
                $id: "reports",
                $label: "Reports",
                children: [{
                    $id: "section",
                    $label: "Section",
                    children: []
                }]
            }, {
                sectionId: "holder"
            });

            runtime.registerNavigationItem({
                $id: "holder",
                $label: "Holder",
                children: []
            });

            let errorMessage = "";

            try {
                runtime._validateRegistrations();
            } catch (error: unknown) {
                errorMessage = (error as Error).message;
            }

            expect(errorMessage).toContain("declared inline in another section");
            expect(errorMessage).not.toContain("declared inline in the \"reports\" section");
        });

        test.concurrent("when a declaration that did not get the identifier has a different label, the report says which", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Alpha",
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Beta",
                children: []
            }, {
                sectionId: "holder"
            });

            runtime.registerNavigationItem({
                $id: "holder",
                $label: "Holder",
                children: []
            });

            expect(() => runtime._validateRegistrations()).toThrow(/a "\$label" of "Beta"/);
        });

        test.concurrent("when an ignored declaration has a different label, the report says which", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: "Settings",
                children: []
            });

            // Two modules that disagree on the label are naming two different sections with the same
            // identifier, which is the cheapest way to collide by accident and the one the removed throw used
            // to catch.
            runtime.registerNavigationItem({
                $id: "section",
                $label: "Preferences",
                children: []
            });

            expect(() => runtime._validateRegistrations()).toThrow(/a "\$label" of "Preferences"/);
        });

        test.concurrent("when the labels of a shared section are not strings, nothing is reported", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            // A "$label" is a "ReactNode". Two modules rendering the same label through their own element hold
            // different objects, therefore comparing anything but two strings would report every correctly
            // shared section.
            runtime.registerNavigationItem({
                $id: "section",
                $label: <span>Section</span>,
                children: []
            });

            runtime.registerNavigationItem({
                $id: "section",
                $label: <span>Section</span>,
                children: []
            });

            expect(() => runtime._validateRegistrations()).not.toThrow();
        });
    });

    describe.concurrent("includeRoutes", () => {
        test.concurrent("when includeRoutes is false, the route registrations are not validated", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            // A route nested under a parent that is never registered. Routes are frozen after the first
            // registration phase, so re-validating them on a deferred registration update run could only
            // re-throw a bootstrap misconfiguration on every flag flip.
            runtime.registerRoute({
                path: "/nested",
                element: <div>Hello!</div>
            }, {
                parentPath: "/missing"
            });

            expect(() => runtime._validateRegistrations()).toThrow();
            expect(() => runtime._validateRegistrations({ includeRoutes: false })).not.toThrow();
        });

        test.concurrent("when includeRoutes is false, the navigation item registrations are still validated", ({ expect }) => {
            const runtime = new ReactRouterRuntime({
                loggers: [new NoopLogger()]
            });

            runtime.registerNavigationItem({
                $label: "Link",
                to: "/link"
            }, {
                sectionId: "section"
            });

            expect(() => runtime._validateRegistrations({ includeRoutes: false })).toThrow(/Missing navigation section "section"/);
        });
    });
});

describe.concurrent("getNavigationItemsByMenu", () => {
    test.concurrent("should return an empty Map when no items have been registered", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        const result = runtime.getNavigationItemsByMenu();

        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(0);
    });

    test.concurrent("should return items grouped by menu id across multiple menus", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Root",
            to: "/root"
        });

        runtime.registerNavigationItem({
            $label: "Link A",
            to: "/link-a"
        }, {
            menuId: "menu-a"
        });

        runtime.registerNavigationItem({
            $label: "Link B",
            to: "/link-b"
        }, {
            menuId: "menu-b"
        });

        runtime.registerNavigationItem({
            $label: "Link A2",
            to: "/link-a2"
        }, {
            menuId: "menu-a"
        });

        const result = runtime.getNavigationItemsByMenu();

        expect(result.size).toBe(3);
        expect(result.get("root")!.length).toBe(1);
        expect(result.get("menu-a")!.length).toBe(2);
        expect(result.get("menu-b")!.length).toBe(1);
        expect(result.get("menu-a")![0].to).toBe("/link-a");
        expect(result.get("menu-a")![1].to).toBe("/link-a2");
    });

    test.concurrent("should return the same Map reference across successive calls", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Root",
            to: "/root"
        });

        const first = runtime.getNavigationItemsByMenu();
        const second = runtime.getNavigationItemsByMenu();

        expect(first).toBe(second);
    });

    test.concurrent("should invalidate the cached Map after a new registration", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Root",
            to: "/root"
        });

        const first = runtime.getNavigationItemsByMenu();

        runtime.registerNavigationItem({
            $label: "Other",
            to: "/other"
        }, {
            menuId: "other"
        });

        const second = runtime.getNavigationItemsByMenu();

        expect(first).not.toBe(second);
        expect(second.size).toBe(2);
    });

    test.concurrent("should invalidate the cached Map after a nested registration", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $id: "section",
            $label: "Section",
            children: []
        });

        const first = runtime.getNavigationItemsByMenu();

        runtime.registerNavigationItem({
            $label: "Nested",
            to: "/nested"
        }, {
            sectionId: "section"
        });

        const second = runtime.getNavigationItemsByMenu();

        expect(first).not.toBe(second);
        expect(second.get("root")![0].children![0].to).toBe("/nested");
    });

    test.concurrent("should invalidate the cached Map after deferred items are cleared", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Static",
            to: "/static"
        });

        runtime.startDeferredRegistrationScope({ transactional: true });

        runtime.registerNavigationItem({
            $label: "Deferred",
            to: "/deferred"
        });

        runtime.completeDeferredRegistrationScope();

        const first = runtime.getNavigationItemsByMenu();

        expect(first.get("root")!.length).toBe(2);

        runtime.startDeferredRegistrationScope({ transactional: true });
        runtime.completeDeferredRegistrationScope();

        const second = runtime.getNavigationItemsByMenu();

        expect(first).not.toBe(second);
        expect(second.get("root")!.length).toBe(1);
        expect(second.get("root")![0].to).toBe("/static");
    });

    test.concurrent("should not let consumers mutate the internal registry through the returned Map", ({ expect }) => {
        const runtime = new ReactRouterRuntime({
            loggers: [new NoopLogger()]
        });

        runtime.registerNavigationItem({
            $label: "Root",
            to: "/root"
        });

        const result = runtime.getNavigationItemsByMenu();

        result.delete("root");
        result.set("forged", [{ $label: "Forged", to: "/forged" }]);

        // Trigger cache invalidation so a fresh Map is built from the internal state.
        runtime.registerNavigationItem({
            $label: "Second",
            to: "/second"
        });

        const fresh = runtime.getNavigationItemsByMenu();

        expect(fresh.has("forged")).toBe(false);
        expect(fresh.get("root")!.length).toBe(2);
        expect(fresh.get("root")![0].to).toBe("/root");
        expect(fresh.get("root")![1].to).toBe("/second");
    });
});
