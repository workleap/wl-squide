import type { RequestHandler } from "msw";
import { MswState } from "./mswState.ts";
// import { isMswReady } from "./mswState.ts";

export class RequestHandlerRegistry {
    readonly #mswState: MswState;
    readonly #handlers: RequestHandler[] = [];

    constructor(mswState: MswState) {
        this.#mswState = mswState;
    }

    add(handlers: RequestHandler[]) {
        if (this.#mswState.isReady) {
            throw new Error("[squide] MSW request handlers cannot be registered once MSW is started. Did you defer the registration of a MSW request handler?");
        }

        this.#handlers.push(...handlers);
    }

    // Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
    // A type annotation is necessary.
    get handlers(): RequestHandler[] {
        return this.#handlers;
    }
}

