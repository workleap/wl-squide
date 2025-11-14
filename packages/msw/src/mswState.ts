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

// let mswState: MswState | undefined;

// function getMswState() {
//     if (!mswState) {
//         mswState = new MswState();
//     }

//     return mswState;
// }

// // This function should only be used by tests.
// export function __setMswState(state: MswState) {
//     mswState = state;
// }

// // This function should only be used by tests.
// export function __clearMswState() {
//     mswState = undefined;
// }

// export function setMswAsReady() {
//     getMswState().setAsReady();
// }

// export function isMswReady() {
//     return getMswState().isReady;
// }

// export function addMswStateChangedListener(callback: MswStateChangedListener) {
//     getMswState().addStateChangedListener(callback);
// }

// export function removeMswStateChangedListener(callback: MswStateChangedListener) {
//     getMswState().removeStateChangedListener(callback);
// }
