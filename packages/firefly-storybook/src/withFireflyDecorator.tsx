import { AppRouter, FireflyProvider, FireflyRuntime } from "@squide/firefly";
import type { PropsWithChildren, ReactNode } from "react";
import { createMemoryRouter, type InitialEntry, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { Decorator } from "@storybook/react";

export interface FireflyDecoratorRouteArgs {
    // The Storybook story element to mount.
    story: ReactNode;
}

// Describes the route(s) nested under the Squide "RootRoute" element.
//
// Provide a "RouteObject" (or an array) to replace the default "{ path: "/story", element: story }" route, or
// a function receiving the story element to compose the route tree dynamically (e.g. to attach a "handle" or
// declare children for an "<Outlet />").
export type FireflyDecoratorRoute =
    | RouteObject
    | RouteObject[]
    | ((args: FireflyDecoratorRouteArgs) => RouteObject | RouteObject[]);

export interface FireflyDecoratorOptions {
    // Customize the route(s) mounted under the Squide "RootRoute" element. Defaults to "{ path: "/story", element: story }".
    route?: FireflyDecoratorRoute;
    // The initial entries for the in-memory router. Defaults to ["/story"]. When providing a "route" with a custom
    // "path", set "initialEntries" to a matching location, otherwise the router won't match any route.
    initialEntries?: InitialEntry[];
}

export function withFireflyDecorator(runtime: FireflyRuntime, options: FireflyDecoratorOptions = {}): Decorator {
    const {
        route,
        initialEntries
    } = options;

    return story => {
        return (
            <FireflyDecorator runtime={runtime} route={route} initialEntries={initialEntries}>
                {story()}
            </FireflyDecorator>
        );
    };
}

export interface FireflyDecoratorProps extends PropsWithChildren, FireflyDecoratorOptions {
    runtime: FireflyRuntime;
}

export function FireflyDecorator(props: FireflyDecoratorProps) {
    const {
        runtime,
        children: story,
        // "story" is destructured first so it can be referenced by this default.
        route = { path: "/story", element: story },
        initialEntries = ["/story"]
    } = props;

    return (
        <FireflyProvider runtime={runtime}>
            <AppRouter strictMode={false}>
                {({ rootRoute, routerProps, routerProviderProps }) => {
                    const storyRoute = typeof route === "function" ? route({ story }) : route;
                    const childRoutes = Array.isArray(storyRoute) ? storyRoute : [storyRoute];

                    return (
                        <RouterProvider
                            router={createMemoryRouter([
                                {
                                    element: rootRoute,
                                    children: childRoutes
                                }
                            ], {
                                ...routerProps,
                                initialEntries
                            })}
                            {...routerProviderProps}
                        />
                    );
                }}
            </AppRouter>
        </FireflyProvider>
    );
}
