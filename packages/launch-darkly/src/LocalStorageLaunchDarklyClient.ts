import type { LDContext, LDFlagSet, LDFlagValue } from "launchdarkly-js-sdk-common";
import type { EditableFakeLaunchDarklyClient, SetFlagOptions } from "./EditableFakeLaunchDarklyClient.ts";
import { LaunchDarklyClientNotifier } from "./InMemoryLaunchDarklyClient.ts";

export interface LocalStorageLaunchDarklyClientOptions {
    context?: LDContext;
    notifier?: LaunchDarklyClientNotifier;
};

export function createLocalStorageLaunchDarklyClient(storageKey: string, defaultFeatureFlagValues: Map<string, LDFlagValue>, options: LocalStorageLaunchDarklyClientOptions = {}) {
    return LocalStorageLaunchDarklyClient.create(storageKey, defaultFeatureFlagValues, options);
}

export class LocalStorageLaunchDarklyClient implements EditableFakeLaunchDarklyClient {
    readonly #storageKey: string;
    #defaultFeatureFlagValues: Map<string, LDFlagValue>;
    #flags: Map<string, LDFlagValue> = new Map();
    readonly #context: LDContext;
    readonly #notifier: LaunchDarklyClientNotifier;

    constructor(storageKey: string, defaultFeatureFlagValues: Map<string, LDFlagValue>, options: LocalStorageLaunchDarklyClientOptions = {}) {
        const {
            context,
            notifier
        } = options;

        this.#context = context ?? {
            kind: "user",
            anonymous: true
        };

        this.#notifier = notifier ?? new LaunchDarklyClientNotifier();
        this.#storageKey = storageKey;
        this.#defaultFeatureFlagValues = defaultFeatureFlagValues;
    }

    static create(storageKey: string, defaultFeatureFlagValues: Map<string, LDFlagValue>, options: LocalStorageLaunchDarklyClientOptions = {}) {
        const client = new LocalStorageLaunchDarklyClient(
            storageKey,
            defaultFeatureFlagValues,
            options
        );

        client.initialize();
        return client;
    }

    private initialize() {
        const featureFlags = initializeFeatureFlags(this.#storageKey, this.#defaultFeatureFlagValues);
        this.setFeatureFlags(Object.fromEntries(featureFlags), { notify: false });

        // Listen for localStorage changes made in other tabs/windows
        this.onStorageUpdated = this.onStorageUpdated.bind(this);
        window.addEventListener("storage", this.onStorageUpdated);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(key: string, callback: (...args: any[]) => void) {
        this.#notifier.addListener(key, callback);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(key: string, callback: (...args: any[]) => void) {
        this.#notifier.removeListener(key, callback);
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

    track(): void {}

    allFlags() {
        return Object.fromEntries(this.#flags);
    }

    addHook(): void {}

    close(onDone?: () => void) {
        window.removeEventListener("storage", this.onStorageUpdated);
        onDone?.();

        return Promise.resolve();
    }

    setFeatureFlags(flags: Record<string, LDFlagValue>, options?: SetFlagOptions): void {
        const {
            notify = true
        } = options ?? {};

        for (const [name, value] of Object.entries(flags)) {
            this.#flags.set(name, value);
        }
        if (notify) {
            this.#notifier.notify("change", flags);
        }

        this.updateLocalStorage();
    }

    onStorageUpdated(event: StorageEvent) {
        if (event.key !== this.#storageKey || !event.newValue) {
            return;
        }

        try {
            const newFlag = JSON.parse(event.newValue);
            const currentFlags = new Map(Object.entries(this.allFlags()));
            const updatedFlags = new Map<string, LDFlagValue>();

            for (const [key, value] of Object.entries(newFlag)) {
                if (currentFlags.get(key) !== value) {
                    updatedFlags.set(key, value);
                }
            }

            if (updatedFlags.size > 0) {
                this.setFeatureFlags(Object.fromEntries(updatedFlags));
            }
        } catch {
            // Ignore malformed updates
        }
    }

    updateLocalStorage() {
        localStorage.setItem(this.#storageKey, JSON.stringify(this.allFlags()));
    }
}

function initializeFeatureFlags(storageKey: string, defaultFeatureFlags: Map<string, LDFlagValue>) {
    const storedFlags = localStorage.getItem(storageKey);
    const featureFlags = new Map<string, LDFlagValue>();

    if (storedFlags) {
        const parsedFlags = JSON.parse(storedFlags);
        // when we load the feature flags from localStorage, we need to make sure
        // that the keys are valid feature flags and delete the others

        for (const [key, value] of Object.entries(parsedFlags)) {
            if (defaultFeatureFlags.has(key)) {
                featureFlags.set(key, value);
            }
        }

        // add all missing feature flags and initialize them to their default value
        for (const [key, value] of defaultFeatureFlags) {
            if (!featureFlags.has(key)) {
                featureFlags.set(key, value);
            }
        }
    } else {
        // Initialize all feature flags to the default value
        for (const [key, value] of defaultFeatureFlags) {
            featureFlags.set(key, value);
        }
    }

    return featureFlags;
}
