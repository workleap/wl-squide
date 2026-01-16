import { LDFlagValue } from "launchdarkly-js-sdk-common";
import type { SetFlagOptions } from "./EditableLDClient.ts";
import { InMemoryLaunchDarklyClient, type InMemoryLaunchDarklyClientOptions } from "./InMemoryLaunchDarklyClient.ts";

export type LocalStorageLaunchDarklyClientOptions = InMemoryLaunchDarklyClientOptions;

export class LocalStorageLaunchDarklyClient extends InMemoryLaunchDarklyClient {
    #storageKey: string;

    constructor(storageKey: string, defaultFeatureFlagValues: Map<string, LDFlagValue>, options: LocalStorageLaunchDarklyClientOptions = {}) {
        super(initializeFeatureFlags(storageKey, defaultFeatureFlagValues), options);

        this.#storageKey = storageKey;

        // Save the feature flags to localStorage initially then on every change
        this.updateLocalStorage();

        // Listen for localStorage changes made in other tabs/windows
        this.onStorageUpdated = this.onStorageUpdated.bind(this);
        window.addEventListener("storage", this.onStorageUpdated);
    }

    close(): void {
        window.removeEventListener("storage", this.onStorageUpdated);
        super.close();
    }

    setFeatureFlag(name: string, value: LDFlagValue, options?: SetFlagOptions): void {
        super.setFeatureFlag(name, value, options);
        this.updateLocalStorage();
    }

    setFeatureFlags(flags: Record<string, LDFlagValue>, options?: SetFlagOptions): void {
        super.setFeatureFlags(flags, options);
        this.updateLocalStorage();
    }

    onStorageUpdated(event: StorageEvent) {
        if (event.key !== this.#storageKey || !event.newValue) {
            return;
        }

        try {
            const incoming = JSON.parse(event.newValue);
            const currentFlags = new Map(Object.entries(this.allFlags()));
            const modifiedFeatureFlags = new Map<string, LDFlagValue>();

            for (const [key, value] of Object.entries(incoming)) {
                if (currentFlags.get(key) !== value) {
                    modifiedFeatureFlags.set(key, value);
                }
            }

            if (modifiedFeatureFlags.size > 0) {
                super.setFeatureFlags(Object.fromEntries(modifiedFeatureFlags));
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
