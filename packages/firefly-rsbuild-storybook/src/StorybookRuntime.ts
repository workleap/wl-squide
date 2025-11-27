import { FireflyRuntime, FireflyRuntimeOptions, FireflyRuntimeScope } from "@squide/firefly";
import { HoneycombInstrumentationPartialClient } from "@workleap-telemetry/core";
import { Logger } from "@workleap/logging";

export class StorybookRuntime extends FireflyRuntime {
    constructor(options: FireflyRuntimeOptions = {}) {
        const {
            honeycombInstrumentationClient
        } = options;

        if (honeycombInstrumentationClient) {
            throw new Error("[squide] A StorybookRuntime instance should not receive an Honeycomb client.");
        }

        super(options);
    }

    registerRoute() {
        // Ignore routes registration because it doesn't matter for a Storybook host application.
    }

    get honeycombInstrumentationClient(): HoneycombInstrumentationPartialClient {
        throw new Error("[squide] Cannot retrieve the Honeycomb instrumentation client from a StorybookRuntime instance.");
    }

    startScope(logger: Logger) {
        return (new StorybookRuntimeScope(this, logger) as unknown) as StorybookRuntime;
    }
}

export class StorybookRuntimeScope extends FireflyRuntimeScope { }
