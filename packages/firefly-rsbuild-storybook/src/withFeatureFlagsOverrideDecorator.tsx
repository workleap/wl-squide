import { FeatureFlags, isEditableLaunchDarklyClient, LaunchDarklyClientTransaction, useLaunchDarklyClient } from "@squide/launch-darkly";
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

    const transactionRef = useRef<LaunchDarklyClientTransaction | undefined>(undefined);
    const client = useLaunchDarklyClient();

    // eslint-disable-next-line react-hooks/refs
    if (!transactionRef.current) {
        if (!isEditableLaunchDarklyClient(client)) {
            throw new Error("[squide] The withFeatureFlagsOverrideDecorator hook can only be used with an EditableLaunchDarklyClient instance.");
        }

        transactionRef.current = client.startTransaction();
        client.setFeatureFlags(overrides);
    }

    useEffect(() => {
        return () => {
            // Reset the feature flags to the original values.
            transactionRef.current?.undo();
            transactionRef.current = undefined;
        };
    }, [transactionRef]);

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
