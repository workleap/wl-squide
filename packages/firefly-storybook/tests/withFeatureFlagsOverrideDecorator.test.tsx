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
    // Regression test for https://github.com/workleap/wl-squide/issues/571
    // Simulates the race condition where a previous component instance started a transaction
    // but its useEffect cleanup hasn't run yet when the new instance mounts.
    test.concurrent("the decorator does not crash when a previous transaction is still active", async ({ expect }) => {
        const launchDarklyClient = new InMemoryLaunchDarklyClient({
            "flag-a": true,
            "flag-b": false
        });

        const runtime = await initializeFireflyForStorybook({
            launchDarklyClient,
            loggers: [new NoopLogger()]
        });

        // Simulate a lingering transaction from a previous component instance.
        launchDarklyClient.startTransaction();

        const Decorator = withFeatureFlagsOverrideDecorator({
            "flag-a": false
        });

        // Should not throw — resetTransaction() handles the lingering transaction.
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

    // Regression test for https://github.com/workleap/wl-squide/issues/571
    // After resetTransaction() undoes a previous transaction, the old instance's deferred
    // cleanup must not throw when it runs (because the transaction is already completed).
    test.concurrent("the cleanup does not throw when the transaction was already reset by a new instance", async ({ expect }) => {
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

        // First instance renders and starts a transaction.
        const { unmount: unmountFirst } = render(
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

        // Simulate what resetTransaction() does: undo the active transaction
        // before the first instance's cleanup runs.
        launchDarklyClient.resetTransaction();

        // The first instance's cleanup runs — should not throw because the
        // isActive guard skips undo() on a completed transaction.
        expect(() => unmountFirst()).not.toThrow();

        // Original flags should be restored.
        expect(runtime.launchDarklyClient.variation("flag-a")).toBeTruthy();
    });

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

    // Regression test for https://github.com/workleap/wl-squide/issues/571
    test("the decorator does not crash when a previous transaction is still active", async ({ expect }) => {
        const launchDarklyClient = createLocalStorageLaunchDarklyClient({
            "flag-a": true,
            "flag-b": false
        });

        const runtime = await initializeFireflyForStorybook({
            launchDarklyClient,
            loggers: [new NoopLogger()]
        });

        // Simulate a lingering transaction from a previous component instance.
        (launchDarklyClient as unknown as { startTransaction(): unknown }).startTransaction();

        const Decorator = withFeatureFlagsOverrideDecorator({
            "flag-a": false
        });

        // Should not throw — resetTransaction() handles the lingering transaction.
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

    // Regression test for https://github.com/workleap/wl-squide/issues/571
    test("the cleanup does not throw when the transaction was already reset by a new instance", async ({ expect }) => {
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

        const { unmount: unmountFirst } = render(
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

        (launchDarklyClient as unknown as { resetTransaction(): void }).resetTransaction();

        expect(() => unmountFirst()).not.toThrow();
        expect(runtime.launchDarklyClient.variation("flag-a")).toBeTruthy();
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
