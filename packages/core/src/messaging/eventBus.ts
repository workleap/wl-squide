import { EventEmitter } from "eventemitter3";
import type { RuntimeLogger } from "../runtime/RuntimeLogger.ts";

export type EventName = string | symbol;

export type EventCallbackFunction<TPayload = unknown> = (data?: TPayload) => void;

export interface EventBusOptions {
    logger?: RuntimeLogger;
}

export interface AddListenerOptions {
    once?: boolean;
}

export interface RemoveListenerOptions {
    once?: boolean;
}

export class EventBus<TEventNames extends EventName = EventName, TPayload = unknown> {
    readonly #eventEmitter: EventEmitter;
    #logger?: RuntimeLogger;

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
        this.#logger?.debug(`[squide] Dispatching event "${String(eventName)}"`, payload);

        this.#eventEmitter.emit(eventName, payload);
    }
}
