import { AppRouter, FireflyProvider, FireflyRuntime } from "@squide/firefly";
import type { PropsWithChildren } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Decorator } from "storybook-react-rsbuild";

export function withFireflyDecorator(runtime: FireflyRuntime): Decorator {
    return story => {
        return (
            <FireflyDecorator runtime={runtime}>
                {story()}
            </FireflyDecorator>
        );
    };
}

export interface FireflyDecoratorProps extends PropsWithChildren {
    runtime: FireflyRuntime;
}

export function FireflyDecorator(props: FireflyDecoratorProps) {
    const {
        runtime,
        children: story
    } = props;

    return (
        <FireflyProvider runtime={runtime}>
            <AppRouter strictMode={false}>
                {({ rootRoute, routerProviderProps }) => {
                    return (
                        <RouterProvider
                            router={createMemoryRouter([{
                                element: rootRoute,
                                children: [{
                                    path: "/story",
                                    element: story
                                }]
                            }], {
                                initialEntries: ["/story"]
                            })}
                            {...routerProviderProps}
                        />
                    );
                }}
            </AppRouter>
        </FireflyProvider>
    );
}
