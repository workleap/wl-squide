import { Runtime } from "@squide/core";
import { NoopLogger } from "@workleap/logging";
import { test } from "vitest";
import { EnvironmentVariablesPlugin } from "../src/EnvironmentVariablesPlugin.ts";

declare module "../src/EnvironmentVariablesRegistry.ts" {
    interface EnvironmentVariables {
        foo: string;
        bar: number;
        john: string;
    }
}

class DummyRuntime extends Runtime {
    registerRoute() {
        throw new Error("Method not implemented.");
    }

    registerPublicRoute() {
        throw new Error("Method not implemented.");
    }

    get routes() {
        return [];
    }

    registerNavigationItem() {
        throw new Error("Method not implemented.");
    }

    getNavigationItems() {
        return [];
    }

    startDeferredRegistrationScope(): void {
        throw new Error("Method not implemented.");
    }

    completeDeferredRegistrationScope(): void {
        throw new Error("Method not implemented.");
    }

    startScope(): Runtime {
        return new DummyRuntime({ loggers: [new NoopLogger()] });
    }

    _validateRegistrations(): void {
        throw new Error("Method not implemented.");
    }
}

test.concurrent("can provide environment variables as an option", ({ expect }) => {
    const runtime = new DummyRuntime();

    const plugin = new EnvironmentVariablesPlugin(runtime, {
        variables: {
            foo: "bar",
            john: "doe"
        }
    });

    expect(plugin.getVariable("foo")).toBe("bar");
    expect(plugin.getVariable("john")).toBe("doe");
});
