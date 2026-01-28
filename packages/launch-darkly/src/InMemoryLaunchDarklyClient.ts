import { LDContext, LDFlagSet, LDFlagValue } from "launchdarkly-js-sdk-common";
import type { EditableLaunchDarklyClient, SetFeatureFlagOptions } from "./EditableLaunchDarklyClient.ts";
import { LaunchDarklyClientNotifier } from "./LaunchDarklyNotifier.ts";
import { computeChangeset } from "./computeChangeset.ts";
import { FeatureFlags } from "./featureFlags.ts";

export interface InMemoryLaunchDarklyClientOptions {
    context?: LDContext;
    notifier?: LaunchDarklyClientNotifier;
}

export class InMemoryLaunchDarklyClient implements EditableLaunchDarklyClient {
    readonly #flags: Record<string, LDFlagValue>;
    readonly #context: LDContext;
    readonly #notifier: LaunchDarklyClientNotifier;

    constructor(featureFlags: Partial<FeatureFlags>, options: InMemoryLaunchDarklyClientOptions = {}) {
        const {
            context,
            notifier = new LaunchDarklyClientNotifier()
        } = options;

        this.#flags = featureFlags;

        this.#context = context ?? {
            kind: "user",
            anonymous: true
        };

        this.#notifier = notifier;
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
        const flag = this.#flags[key];

        return flag ?? defaultValue;
    }

    variationDetail(key: string, defaultValue?: LDFlagValue) {
        const flag = this.#flags[key];

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

    // IMPORTANT-1: Must return the flags object provided to the "ctor" to support "withFeatureFlagsOverrideDecorator".
    // IMPORTANT-2: To support "useSyncExternalStore" it's also important that the flags object isn't a new reference everytime
    // this method is called.
    allFlags() {
        return this.#flags;
    }

    close(onDone?: () => void) {
        onDone?.();

        return Promise.resolve();
    }

    addHook(): void {}

    setFeatureFlags(newFlags: Partial<FeatureFlags>, options: SetFeatureFlagOptions = {}): void {
        const {
            notify = true
        } = options;

        const keys = Object.keys(newFlags);

        if (keys.length > 0) {
            const originalFlags = { ...this.#flags };

            (keys as Array<keyof FeatureFlags>).forEach(x => {
                this.#flags[x] = newFlags[x];
            });

            if (notify) {
                const changeset = computeChangeset(originalFlags, this.#flags);

                this.#notifier.notify("change", changeset);
            }
        }
    }
}
