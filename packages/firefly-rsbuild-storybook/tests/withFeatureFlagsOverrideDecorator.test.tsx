import { test } from "vitest";
import { withFeatureFlagsOverrideDecorator } from "../src/withFeatureFlagsOverrideDecorator.tsx";

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

test.concurrent("the feature flags are overrided when the story is rendered", ({ expect }) => {
    const featureFlags = new Map([
        ["flag-a", true]
    ] as const);

    const render = withFeatureFlagsOverrideDecorator(featureFlags, {
        "flag-a": false
    });

    render(
        () => <Component expect={() => expect(featureFlags.get("flag-a")).toBeFalsy()} />,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        null);

    expect(featureFlags.get("flag-a")).toBeTruthy();
});

test.concurrent("the original feature flags value are reset after the story has been rendered", ({ expect }) => {
    const featureFlags = new Map([
        ["flag-a", true]
    ] as const);

    const render = withFeatureFlagsOverrideDecorator(featureFlags, {
        "flag-a": false
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    render(() => <Component />, null);

    expect(featureFlags.get("flag-a")).toBeTruthy();
});
