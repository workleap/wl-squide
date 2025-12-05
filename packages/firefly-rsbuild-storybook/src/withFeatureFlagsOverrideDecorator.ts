import { Decorator } from "storybook-react-rsbuild";

export function withFeatureFlagsOverrideDecorator(featureFlags: Map<string, unknown>, overrides: Record<string, unknown>): Decorator {
    if (!(featureFlags instanceof Map)) {
        throw new TypeError("[squide] The \"featureFlags\" argument must be a Map instance.");
    }

    return story => {
        // Update the map with overrides for this story.
        Object.entries(overrides).forEach(([key, value]) => {
            featureFlags.set(key, value);
        });

        return story();
    };
}
