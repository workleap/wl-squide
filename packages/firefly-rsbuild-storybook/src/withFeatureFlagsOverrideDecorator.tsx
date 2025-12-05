import { PropsWithChildren, useLayoutEffect } from "react";
import { Decorator } from "storybook-react-rsbuild";

interface OverrideFeatureFlagsProps extends PropsWithChildren {
    featureFlags: Map<string, unknown>;
    overrides: Record<string, unknown>;
}

function OverrideFeatureFlags(props: OverrideFeatureFlagsProps) {
    const {
        featureFlags,
        overrides,
        children
    } = props;

    // Must use a layout effect to override the feature flags before the story renders.
    useLayoutEffect(() => {
        const originalValues: Record<string, unknown> = {};

        Object.entries(overrides).forEach(([key, value]) => {
            originalValues[key] = featureFlags.get(key);
            featureFlags.set(key, value);
        });

        return () => {
            // Reset the feature flags to the original values.
            Object.entries(originalValues).forEach(([key, value]) => {
                featureFlags.set(key, value);
            });
        };
    }, [featureFlags, overrides]);

    return children;
}

export function withFeatureFlagsOverrideDecorator(featureFlags: Map<string, unknown>, overrides: Record<string, unknown>): Decorator {
    if (!(featureFlags instanceof Map)) {
        throw new TypeError("[squide] The \"featureFlags\" argument must be a Map instance.");
    }

    return story => {
        return (
            <OverrideFeatureFlags featureFlags={featureFlags} overrides={overrides}>
                {story()}
            </OverrideFeatureFlags>
        );
    };
}
