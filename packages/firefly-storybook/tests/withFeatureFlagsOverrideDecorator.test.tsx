import { createLocalStorageLaunchDarklyClient, InMemoryLaunchDarklyClient, RuntimeContext } from "@squide/firefly";
import { render } from "@testing-library/react";
import { NoopLogger } from "@workleap/logging";
import { ReactNode } from "react";
import { afterEach, beforeEach, describe, test } from "vitest";
import { initializeFireflyForStorybook } from "../src/initializeFireflyForStorybook.ts";
import { withFeatureFlagsOverrideDecorator } from "../src/withFeatureFlagsOverrideDecorator.tsx";

declare module "@squide/firefly" {
    interface FeatureFlags {
        "flag-a": boolean;
        "flag-b": boolean;
    }
}

interface ComponentProps {
    expect?: () => void;
}

function Component(props: ComponentProps) {
    const {
        expect
    } = props;

    expect?.();

    return (
        <div>Hey!</div>
    );
}

describe.concurrent("InMemoryLaunchDarklyClient", () => {
    test.concurrent("the feature flags are overridden when the story is rendered", async ({ expect }) => {
        const launchDarklyClient = new InMemoryLaunchDarklyClient({
            "flag-a": true,
            "flag-b": false
        });

        const runtime = await initializeFireflyForStorybook({
            launchDarklyClient,
            loggers: [new NoopLogger()]
        });

        const Decorator = withFeatureFlagsOverrideDecorator({
            "flag-a": false
        });

        render(
            Decorator(
                () => <Component expect={() => expect(runtime.launchDarklyClient.variation("flag-a")).toBeFalsy()} />,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                null
            ), {
                wrapper: ({ children }: { children: ReactNode }) => (
                    <RuntimeContext.Provider value={runtime}>
                        {children}
                    </RuntimeContext.Provider>
                )
            });
    });

    test.concurrent("the original feature flags value are reset after the story has been rendered", async ({ expect }) => {
        const launchDarklyClient = new InMemoryLaunchDarklyClient({
            "flag-a": true,
            "flag-b": false
        });

        const runtime = await initializeFireflyForStorybook({
            launchDarklyClient,
            loggers: [new NoopLogger()]
        });

        const Decorator = withFeatureFlagsOverrideDecorator({
            "flag-a": false
        });

        const { unmount } = render(
            Decorator(
                () => <Component />,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                null
            ), {
                wrapper: ({ children }: { children: ReactNode }) => (
                    <RuntimeContext.Provider value={runtime}>
                        {children}
                    </RuntimeContext.Provider>
                )
            });

        unmount();

        // The flag should be re-assign to his original value.
        expect(runtime.launchDarklyClient.variation("flag-a")).toBeTruthy();
    });
});

describe("LocalStorageLaunchDarklyClient", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    test("the feature flags are overridden when the story is rendered", async ({ expect }) => {
        const launchDarklyClient = createLocalStorageLaunchDarklyClient({
            "flag-a": true,
            "flag-b": false
        });

        const runtime = await initializeFireflyForStorybook({
            launchDarklyClient,
            loggers: [new NoopLogger()]
        });

        const Decorator = withFeatureFlagsOverrideDecorator({
            "flag-a": false
        });

        render(
            Decorator(
                () => <Component expect={() => expect(runtime.launchDarklyClient.variation("flag-a")).toBeFalsy()} />,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                null
            ), {
                wrapper: ({ children }: { children: ReactNode }) => (
                    <RuntimeContext.Provider value={runtime}>
                        {children}
                    </RuntimeContext.Provider>
                )
            });
    });

    test("the original feature flags value are reset after the story has been rendered", async ({ expect }) => {
        const launchDarklyClient = createLocalStorageLaunchDarklyClient({
            "flag-a": true,
            "flag-b": false
        });

        const runtime = await initializeFireflyForStorybook({
            launchDarklyClient,
            loggers: [new NoopLogger()]
        });

        const Decorator = withFeatureFlagsOverrideDecorator({
            "flag-a": false
        });

        const { unmount } = render(
            Decorator(
                () => <Component />,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                null
            ), {
                wrapper: ({ children }: { children: ReactNode }) => (
                    <RuntimeContext.Provider value={runtime}>
                        {children}
                    </RuntimeContext.Provider>
                )
            });

        unmount();

        // The flag should be re-assign to his original value.
        expect(runtime.launchDarklyClient.variation("flag-a")).toBeTruthy();
    });
});
