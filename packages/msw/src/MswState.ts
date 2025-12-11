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

    addMswReadyListener(callback: MswReadyListener) {
        this.#mswReadyListeners.add(callback);
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

    get isReady() {
        return this.#isReady;
    }
}
