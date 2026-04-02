import { AppRouter, FireflyProvider, FireflyRuntime } from "@squide/firefly";
import type { PropsWithChildren } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import type { Decorator } from "@storybook/react";

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
                {({ rootRoute, routerProps, routerProviderProps }) => {
                    return (
                        <RouterProvider
                            router={createMemoryRouter([
                                {
                                    element: rootRoute,
                                    children: [
                                        {
                                            path: "/story",
                                            element: story
                                        }
                                    ]
                                }
                            ], {
                                ...routerProps,
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
