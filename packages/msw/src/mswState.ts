export type MswReadyListener = () => void;

export class MswState {
    #isReady = false;

    readonly #mswReadyListeners = new Set<MswReadyListener>();

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
