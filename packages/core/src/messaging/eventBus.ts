import type { RootLogger } from "@workleap/logging";
import { EventEmitter } from "eventemitter3";

export type EventName = string | symbol;

export type EventCallbackFunction<TPayload = unknown> = (data?: TPayload) => void;

export interface EventBusOptions {
    // TODO: Remove the optional from this.
    logger?: RootLogger;
}

export interface AddListenerOptions {
    once?: boolean;
}

export interface RemoveListenerOptions {
    once?: boolean;
}

export class EventBus<TEventNames extends EventName = EventName, TPayload = unknown> {
    readonly #eventEmitter: EventEmitter;
    #logger?: RootLogger;

    constructor({ logger }: EventBusOptions = {}) {
        this.#eventEmitter = new EventEmitter();
        this.#logger = logger;
    }

    addListener(eventName: TEventNames, callback: EventCallbackFunction<TPayload>, { once }: AddListenerOptions = {}) {
        if (once === true) {
            this.#eventEmitter.once(eventName, callback);
        } else {
            this.#eventEmitter.addListener(eventName, callback);
        }
    }

    removeListener(eventName: TEventNames, callback: EventCallbackFunction<TPayload>, { once }: RemoveListenerOptions = {}) {
        this.#eventEmitter.removeListener(eventName, callback, undefined, once);
    }

    dispatch(eventName: TEventNames, payload?: TPayload) {
        this.#logger
            ?.withText(`[squide] Dispatching event "${String(eventName)}"`)
            .withObject(payload)
            .debug();

        this.#eventEmitter.emit(eventName, payload);
    }
}
