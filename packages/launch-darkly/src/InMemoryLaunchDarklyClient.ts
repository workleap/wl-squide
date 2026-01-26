import { LDContext, LDFlagSet, LDFlagValue } from "launchdarkly-js-sdk-common";
import type { EditableLaunchDarklyClient, SetFeatureFlagOptions } from "./EditableLaunchDarklyClient.ts";
import { LaunchDarklyClientNotifier } from "./LaunchDarklyNotifier.ts";

export interface InMemoryLaunchDarklyClientOptions {
    context?: LDContext;
    notifier?: LaunchDarklyClientNotifier;
}

export class InMemoryLaunchDarklyClient implements EditableLaunchDarklyClient {
    readonly #flags: Map<string, LDFlagValue>;
    readonly #context: LDContext;
    readonly #notifier: LaunchDarklyClientNotifier;

    #objectLiteralSnapshot: Record<string, LDFlagValue>;

    constructor(featureFlags: Map<string, LDFlagValue>, options: InMemoryLaunchDarklyClientOptions = {}) {
        const {
            context,
            notifier
        } = options;

        if (!(featureFlags instanceof Map)) {
            throw new TypeError("[squide] The \"featureFlags\" argument must be a Map instance.");
        }

        this.#flags = featureFlags;
        this.#objectLiteralSnapshot = Object.fromEntries(featureFlags);

        this.#context = context ?? {
            kind: "user",
            anonymous: true
        };

        this.#notifier = notifier ?? new LaunchDarklyClientNotifier();
    }

    waitUntilGoalsReady() {
        return Promise.resolve();
    }

    waitUntilReady() {
        return Promise.resolve();
    }

    waitForInitialization() {
        return Promise.resolve();
    }

    identify(context: LDContext, hash?: string, onDone?: (err: Error | null, flags: LDFlagSet | null) => void) {
        onDone?.(null, this.#flags);

        return Promise.resolve(this.#flags);
    }

    getContext() {
        return this.#context;
    }

    flush() {
        return Promise.resolve();
    }

    variation(key: string, defaultValue?: LDFlagValue) {
        const flag = this.#flags.get(key);

        return flag ?? defaultValue;
    }

    variationDetail(key: string, defaultValue?: LDFlagValue) {
        const flag = this.#flags.get(key);

        return {
            value: flag ?? defaultValue
        };
    }

    setStreaming(): void {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(key: string, callback: (...args: any[]) => void) {
        this.#notifier.addListener(key, callback);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(key: string, callback: (...args: any[]) => void) {
        this.#notifier.removeListener(key, callback);
    }

    track(): void {}

    // IMPORTANT: Must not return a new instance everytime it's executed as it will breaks "useSyncExternalStore".
    allFlags() {
        return this.#objectLiteralSnapshot;
    }

    close(onDone?: () => void) {
        onDone?.();

        return Promise.resolve();
    }

    addHook(): void {}

    setFeatureFlags(flags: Record<string, LDFlagValue>, options: SetFeatureFlagOptions = {}): void {
        const {
            notify = true
        } = options;

        const entries = Object.entries(flags);

        if (entries.length > 0) {
            for (const [name, value] of entries) {
                this.#flags.set(name, value);
            }

            // Update the snapshot since the flags changed.
            this.#objectLiteralSnapshot = Object.fromEntries(this.#flags);

            if (notify) {
                this.#notifier.notify("change", flags);
            }
        }
    }
}
