import { FeatureFlags, isEditableLaunchDarklyClient, LaunchDarklyClientTransaction, useLaunchDarklyClient } from "@squide/launch-darkly";
import { PropsWithChildren, useEffect, useRef } from "react";
import type { Decorator } from "@storybook/react";

interface OverrideFeatureFlagsProps extends PropsWithChildren {
    overrides: Partial<FeatureFlags>;
}

// Flags are overridden during render (not in a useEffect) so that the first render
// of the story sees the correct flag values. Moving setup to useEffect would cause
// the story to render once with stale flags before the override takes effect.
//
// Fix for https://github.com/workleap/wl-squide/issues/571:
//
// When this component unmounts and a new instance mounts in the same React commit
// (e.g. Storybook remounting the decorator chain), the new instance's render phase
// runs BEFORE the old instance's useEffect cleanup. This means startTransaction()
// would throw because the old transaction is still active on the client.
//
// Neither useLayoutEffect nor useEffect can fix this: React's render phase always
// executes before the commit phase where any cleanup runs. The fix is to call
// resetTransaction() during render, which silently undoes any lingering transaction
// left by a previous instance. This is safe because only one OverrideFeatureFlags
// component is ever active at a time in Storybook's single-story rendering model.
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

        // Undo any lingering transaction from a previous component instance whose
        // useEffect cleanup hasn't run yet. This handles the unmount/remount race
        // condition where React's render phase (synchronous) runs before the commit
        // phase (where useEffect cleanup is deferred). No-op if no transaction is active.
        client.resetTransaction();
        transactionRef.current = client.startTransaction();
        client.setFeatureFlags(overrides);
    }

    useEffect(() => {
        return () => {
            // Reset the feature flags to the original values.
            // Guard with isActive: if a new instance already called resetTransaction()
            // (which undoes this transaction), the transaction is completed and calling
            // undo() again would throw.
            if (transactionRef.current?.isActive) {
                transactionRef.current.undo();
            }
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
