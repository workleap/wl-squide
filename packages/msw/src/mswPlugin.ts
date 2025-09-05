import { Plugin, isNil, type Runtime } from "@squide/core";
import type { Logger } from "@workleap/logging";
import type { RequestHandler } from "msw";
import { RequestHandlerRegistry } from "./requestHandlerRegistry.ts";

export const MswPluginName = "msw-plugin";

export interface MswPluginRegisterRequestHandlersOptions {
    logger?: Logger;
}

export class MswPlugin extends Plugin {
    readonly #requestHandlerRegistry = new RequestHandlerRegistry();

    constructor(runtime: Runtime) {
        super(MswPluginName, runtime);
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
