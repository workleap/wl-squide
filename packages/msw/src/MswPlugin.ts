import { Plugin, isNil, type Runtime } from "@squide/core";
import type { Logger } from "@workleap/logging";
import type { RequestHandler } from "msw";
import { MswState } from "./MswState.ts";
import { RequestHandlerRegistry } from "./RequestHandlerRegistry.ts";

export const MswPluginName = "msw-plugin";

export interface MswPluginOptions {
    state?: MswState;
}

export interface MswPluginRegisterRequestHandlersOptions {
    logger?: Logger;
}

export class MswPlugin extends Plugin {
    readonly #mswState: MswState;
    readonly #requestHandlerRegistry: RequestHandlerRegistry;

    constructor(runtime: Runtime, options: MswPluginOptions = {}) {
        const {
            state = new MswState()
        } = options;

        super(MswPluginName, runtime);

        this.#mswState = state;
        this.#requestHandlerRegistry = new RequestHandlerRegistry(this.#mswState);
    }

    get mswState() {
        return this.#mswState;
    }

    registerRequestHandlers(handlers: RequestHandler[], options: MswPluginRegisterRequestHandlersOptions = {}) {
        const {
            logger
        } = options;

        this.#requestHandlerRegistry.add(handlers);

        (logger ? logger : this._runtime.logger)
            .withText("[squide] The following MSW request handlers has been registered:")
            .withObject(handlers)
            .debug();
    }

    get requestHandlers(): RequestHandler[] {
        return this.#requestHandlerRegistry.handlers;
    }
}

export function getMswPlugin(runtime: Runtime) {
    const plugin = runtime.getPlugin(MswPluginName);

    if (isNil(plugin)) {
        throw new Error("[squide] The getMswPlugin function is called but no MswPlugin instance has been registered with the runtime.");
    }

    return plugin as MswPlugin;
}
