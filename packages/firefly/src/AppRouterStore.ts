// This file is a low cost port of the AppRouterReducer to a non-React store. It allows, non-React parts of the library to get
// access to the state and ease the integration with third-party libraries such as the Platform Widgets.
// Eventually, AppRouterReducer should be deprecated in favor of this new AppRouterStore.

import type { Logger } from "@workleap/logging";
import type { AppRouterAction, AppRouterState } from "./AppRouterReducer.ts";

export type AppRouterStoreState = Omit<AppRouterState, "waitForMsw" | "waitForPublicData" | "waitForProtectedData">;

export type AppRouterStoreListenerFunction = (store: AppRouterStore, unsuscribe: () => void) => void;

export class AppRouterStore {
    #state: AppRouterStoreState;

    readonly #listeners = new Set<AppRouterStoreListenerFunction>();
    readonly #logger: Logger;

    constructor(initialialState: AppRouterStoreState, logger: Logger) {
        this.#state = initialialState;
        this.#logger = logger;
    }

    subscribe(listener: AppRouterStoreListenerFunction) {
        this.#listeners.add(listener);

        return () => {
            this.unsuscribe(listener);
        };
    }

    unsuscribe(listener: AppRouterStoreListenerFunction) {
        this.#listeners.delete(listener);
    }

    dispatch(action: AppRouterAction) {
        const newState = this.#reducer({ ...this.#state }, action);

        this.#logger
            .withText("[squide] The AppRouterStore state has been updated to:")
            .withObject(newState)
            .debug();

        this.#state = newState;

        // Creating a copy of the listeners in case some are removed during the looping.
        // To be honest, it might not be necessary, I simply don't know.
        new Set(this.#listeners).forEach(x => {
            x(this, () => {
                this.unsuscribe(x);
            });
        });
    }

    #reducer(state: AppRouterStoreState, action: AppRouterAction) {
        let newState = state;

        switch (action.type) {
            case "modules-registered": {
                newState = {
                    ...newState,
                    areModulesRegistered: true
                };

                break;
            }
            case "modules-ready": {
                newState = {
                    ...newState,
                    areModulesReady: true,
                    // Will be set even if the app is not using deferred registrations.
                    deferredRegistrationsUpdatedAt: Date.now()
                };

                break;
            }
            case "msw-ready": {
                newState = {
                    ...newState,
                    isMswReady: true
                };

                break;
            }
            case "public-data-ready": {
                newState = {
                    ...newState,
                    isPublicDataReady: true,
                    publicDataUpdatedAt: Date.now()
                };

                break;
            }
            case "protected-data-ready": {
                newState = {
                    ...newState,
                    isProtectedDataReady: true,
                    protectedDataUpdatedAt: Date.now()
                };

                break;
            }
            case "public-data-updated": {
                newState = {
                    ...newState,
                    publicDataUpdatedAt: Date.now()
                };

                break;
            }
            case "protected-data-updated": {
                newState = {
                    ...newState,
                    protectedDataUpdatedAt: Date.now()
                };

                break;
            }
            case "deferred-registrations-updated": {
                newState = {
                    ...newState,
                    deferredRegistrationsUpdatedAt: Date.now()
                };

                break;
            }
            case "active-route-is-public": {
                newState = {
                    ...newState,
                    activeRouteVisibility: "public"
                };

                break;
            }
            case "active-route-is-protected": {
                newState = {
                    ...newState,
                    activeRouteVisibility: "protected"
                };

                break;
            }
            case "is-unauthorized": {
                newState = {
                    ...newState,
                    isUnauthorized: true
                };

                break;
            }
            default: {
                throw new Error(`[squide] The AppRouterStore state reducer doesn't support action type "${action.type}".`);
            }
        }

        return newState;
    }

    get state() {
        return this.#state;
    }
}

export function createAppRouterStore(logger: Logger) {
    const initialState: AppRouterStoreState = {
        areModulesRegistered: false,
        areModulesReady: false,
        isMswReady: false,
        isPublicDataReady: false,
        isProtectedDataReady: false,
        activeRouteVisibility: "unknown",
        isUnauthorized: false
    };

    return new AppRouterStore(initialState, logger);
}
