import memoize, { memoizeClear } from "memoize";

// The "EnvironmentVariables" interface is expected to be extended by remote modules adding their own environment variables to the runtime.
// This magic is called module augmentation: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EnvironmentVariables {}

export type EnvironmentVariablesRegistryKey = keyof EnvironmentVariables;
export type EnvironmentVariablesRegistryValue = EnvironmentVariables[keyof EnvironmentVariables];

export class EnvironmentVariablesRegistry {
    readonly #variables = new Map<EnvironmentVariablesRegistryKey, EnvironmentVariablesRegistryValue>();

    // Since the "getVariables" function is transforming the variables from a Map to an Object, the result of
    // the transformation is memoized to ensure the returned Object is immutable and can be use in React closures.
    readonly #memoizedGetVariables = memoize(() => Object.fromEntries(this.#variables) as unknown as EnvironmentVariables);

    add(key: EnvironmentVariablesRegistryKey, value: EnvironmentVariablesRegistryValue) {
        if (this.#variables.has(key)) {
            const existingValue = this.#variables.get(key);

            if (existingValue !== value) {
                throw new Error(`[squide] An environment variable with the key "${key}" already exist and the new value differs from the existing one. Existing value: "${existingValue}" - New Value: "${value}"`);
            }
        } else {
            this.#variables.set(key, value);

            memoizeClear(this.#memoizedGetVariables);
        }
    }

    addVariables(variables: Partial<EnvironmentVariables>) {
        // Do not clear the "getVariables" memoize result if there are no variables.
        if (Object.keys(variables).length > 0) {
            for (const [key, value] of Object.entries(variables)) {
                this.add(key as EnvironmentVariablesRegistryKey, value as EnvironmentVariablesRegistryValue);
            }

            memoizeClear(this.#memoizedGetVariables);
        }
    }

    getVariable(key: EnvironmentVariablesRegistryKey) {
        const value = this.#variables.get(key);

        if (!value) {
            throw new Error(`[squide] No environment variable has been registered for the key "${key}".`);
        }

        return value;
    }

    getVariables() {
        return this.#memoizedGetVariables();
    }
}
