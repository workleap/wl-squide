import type { RequestHandler } from "msw";
import { MswState } from "./MswState.ts";

export type RequestHandlersPosition = "start" | "end";

export interface RequestHandlerRegistryAddOptions {
    position?: RequestHandlersPosition;
}

export class RequestHandlerRegistry {
    readonly #mswState: MswState;
    readonly #startHandlers: RequestHandler[] = [];
    readonly #endHandlers: RequestHandler[] = [];

    constructor(mswState: MswState) {
        this.#mswState = mswState;
    }

    add(handlers: RequestHandler[], options: RequestHandlerRegistryAddOptions = {}) {
        const {
            position = "end"
        } = options;

        if (this.#mswState.isReady) {
            throw new Error("[squide] MSW request handlers cannot be registered once MSW is started. Did you defer the registration of a MSW request handler?");
        }

        if (position === "start") {
            this.#startHandlers.push(...handlers);
        } else {
            this.#endHandlers.push(...handlers);
        }
    }

    // Handlers registered with the "start" position are returned before those registered with the "end"
    // position; within each group, the registration order is preserved. MSW evaluates handlers in order,
    // which allows fall-through middleware handlers to be registered ahead of the regular handlers.
    // Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
    // A type annotation is necessary.
    get handlers(): RequestHandler[] {
        return [...this.#startHandlers, ...this.#endHandlers];
    }
}

