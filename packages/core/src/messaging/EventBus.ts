import type { Logger } from "@workleap/logging";
import { EventEmitter } from "eventemitter3";

export type EventName = string | symbol;

export type EventCallbackFunction<TPayload = unknown> = (data?: TPayload) => void;

// The "EventMap" interface is expected to be extended by the consumer application.
// This magic is called module augmentation: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EventMap {}

export type EventMapKey = keyof EventMap;

export type EventBusDispatchFunction = {
    <K extends EventMapKey>(eventName: K, payload?: EventMap[K]): void;
    (eventName: EventName, payload?: unknown): void;
};

export interface AddListenerOptions {
    once?: boolean;
}

export interface RemoveListenerOptions {
    once?: boolean;
}

export class EventBus {
    readonly #eventEmitter: EventEmitter;
    readonly #logger: Logger;

    constructor(logger: Logger) {
        this.#eventEmitter = new EventEmitter();
        this.#logger = logger;
    }

    addListener<K extends EventMapKey>(eventName: K, callback: EventCallbackFunction<EventMap[K]>, options?: AddListenerOptions): void;
    addListener(eventName: EventName, callback: EventCallbackFunction, options?: AddListenerOptions): void;
    addListener(eventName: EventName, callback: EventCallbackFunction, options: AddListenerOptions = {}) {
        const {
            once
        } = options;

        if (once === true) {
            this.#eventEmitter.once(eventName, callback);
        } else {
            this.#eventEmitter.addListener(eventName, callback);
        }
    }

    removeListener<K extends EventMapKey>(eventName: K, callback: EventCallbackFunction<EventMap[K]>, options?: RemoveListenerOptions): void;
    removeListener(eventName: EventName, callback: EventCallbackFunction, options?: RemoveListenerOptions): void;
    removeListener(eventName: EventName, callback: EventCallbackFunction, options: RemoveListenerOptions = {}) {
        const {
            once
        } = options;

        this.#eventEmitter.removeListener(eventName, callback, undefined, once);
    }

    dispatch<K extends EventMapKey>(eventName: K, payload?: EventMap[K]): void;
    dispatch(eventName: EventName, payload?: unknown): void;
    dispatch(eventName: EventName, payload?: unknown) {
        this.#logger
            .withText(`[squide] Dispatching event "${String(eventName)}"`)
            .withObject(payload)
            .debug();

        this.#eventEmitter.emit(eventName, payload);
    }
}
