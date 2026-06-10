import type { RequestHandler } from "msw";
import { MswState } from "./MswState.ts";

export interface RequestHandlerRegistryAddOptions {
    prepend?: true;
}

export class RequestHandlerRegistry {
    readonly #mswState: MswState;
    readonly #prependedHandlers: RequestHandler[] = [];
    readonly #appendedHandlers: RequestHandler[] = [];

    constructor(mswState: MswState) {
        this.#mswState = mswState;
    }

    add(handlers: RequestHandler[], options: RequestHandlerRegistryAddOptions = {}) {
        const {
            prepend = false
        } = options;

        if (this.#mswState.isReady) {
            throw new Error("[squide] MSW request handlers cannot be registered once MSW is started. Did you defer the registration of a MSW request handler?");
        }

        if (prepend) {
            this.#prependedHandlers.push(...handlers);
        } else {
            this.#appendedHandlers.push(...handlers);
        }
    }

    // Prepended handlers are returned before the appended ones; within each group, the registration
    // order is preserved. MSW evaluates handlers in order, which allows fall-through middleware
    // handlers to be registered ahead of the regular handlers.
    // Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
    // A type annotation is necessary.
    get handlers(): RequestHandler[] {
        return [...this.#prependedHandlers, ...this.#appendedHandlers];
    }
}

