import { isNil } from "@squide/core/internal";
import { LDClient } from "launchdarkly-js-client-sdk";
import { LDContext, LDFlagSet, LDFlagValue } from "launchdarkly-js-sdk-common";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LaunchDarklyClientListener = (...args: any[]) => void;

export class LaunchDarklyClientNotifier {
    readonly #listeners = new Map<string, Set<LaunchDarklyClientListener>>();

    addListener(key: string, listener: LaunchDarklyClientListener) {
        if (!this.#listeners.has(key)) {
            this.#listeners.set(key, new Set<LaunchDarklyClientListener>());
        }

        this.#listeners.get(key)?.add(listener);
    }

    removeListener(key: string, listener: LaunchDarklyClientListener) {
        this.#listeners.get(key)?.delete(listener);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notify(key: string, ...values: any[]) {
        this.#listeners.get(key)?.forEach(x => {
            x(...values);
        });
    }
}

export interface InMemoryLaunchDarklyClientOptions {
    context?: LDContext;
    notifier?: LaunchDarklyClientNotifier;
}

export class InMemoryLaunchDarklyClient implements LDClient {
    readonly #flags: Map<string, LDFlagValue>;
    readonly #context: LDContext;
    readonly #notifier?: LaunchDarklyClientNotifier;

    constructor(featureFlags: Map<string, LDFlagValue>, options: InMemoryLaunchDarklyClientOptions = {}) {
        const {
            context,
            notifier
        } = options;

        if (!(featureFlags instanceof Map)) {
            throw new TypeError("[squide] The \"featureFlags\" argument must be a Map instance.");
        }

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
        const flag = this.#flags.get(key);

        return flag ?? defaultValue;
    }

    variationDetail(key: string, defaultValue?: LDFlagValue) {
        const flag = this.#flags.get(key);

        return !isNil(flag) ? { value: flag } : defaultValue;
    }

    setStreaming(): void {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(key: string, callback: (...args: any[]) => void) {
        if (this.#notifier) {
            this.#notifier.addListener(key, callback);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(key: string, callback: (...args: any[]) => void) {
        if (this.#notifier) {
            this.#notifier.removeListener(key, callback);
        }
    }

    track(): void {}

    allFlags() {
        return Object.fromEntries(this.#flags);
    }

    close(onDone?: () => void) {
        onDone?.();

        return Promise.resolve();
    }

    addHook(): void {}
}
