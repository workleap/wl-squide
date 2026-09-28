export type MswReadyListener = () => void;

export interface MswStateOptions {
    isReady?: boolean;
}

export class MswState {
    readonly #mswReadyListeners = new Set<MswReadyListener>();
    #isReady: boolean;

    constructor(options: MswStateOptions = {}) {
        const {
            isReady = false
        } = options;

        this.#isReady = isReady;
    }

    registerMswReadyListener(callback: MswReadyListener) {
        this.#mswReadyListeners.add(callback);
    }

    /** @deprecated Use `registerMswReadyListener` instead. */
    addMswReadyListener(callback: MswReadyListener) {
        this.registerMswReadyListener(callback);
    }

    removeMswReadyListener(callback: MswReadyListener) {
        this.#mswReadyListeners.delete(callback);
    }

    setAsReady() {
        if (!this.#isReady) {
            this.#isReady = true;

            this.#mswReadyListeners.forEach(x => {
                x();
            });
        }
    }

    get listenersCount() {
        return this.#mswReadyListeners.size;
    }

    get isReady() {
        return this.#isReady;
    }
}
