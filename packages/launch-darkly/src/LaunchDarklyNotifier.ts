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
