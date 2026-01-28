import { FeatureFlags, useLaunchDarklyClient } from "@squide/launch-darkly";
import { PropsWithChildren, useEffect, useRef } from "react";
import { Decorator } from "storybook-react-rsbuild";

interface OverrideFeatureFlagsProps extends PropsWithChildren {
    overrides: Partial<FeatureFlags>;
}

// Used to override the flags in a "useEffect" hook but then the unit test were not working.
// To fix the unit tests, the flags are now overrided directly in the render function.
function OverrideFeatureFlags(props: OverrideFeatureFlagsProps) {
    const {
        overrides,
        children
    } = props;

    const featureFlags = useLaunchDarklyClient().allFlags();
    const originalValuesRef = useRef<Partial<FeatureFlags> | null>(null);

    // eslint-disable-next-line react-hooks/refs
    if (!originalValuesRef.current) {
        originalValuesRef.current = {};

        // eslint-disable-next-line react-hooks/refs
        (Object.keys(overrides) as Array<keyof FeatureFlags>).forEach(x => {
            originalValuesRef.current![x] = featureFlags[x];
            featureFlags[x] = overrides[x];
        });
    }

    useEffect(() => {
        return () => {
            // Reset the feature flags to the original values.
            (Object.keys(originalValuesRef.current!) as Array<keyof FeatureFlags>).forEach(x => {
                featureFlags[x] = originalValuesRef.current![x];
            });
        };
    }, [originalValuesRef, featureFlags]);

    return children;
}

export function withFeatureFlagsOverrideDecorator(overrides: Partial<FeatureFlags>): Decorator {
    return story => {
        return (
            <OverrideFeatureFlags overrides={overrides}>
                {story()}
            </OverrideFeatureFlags>
        );
    };
}
