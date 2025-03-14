import { describe, test } from "vitest";
import { Logger, Runtime } from "../src/index.ts";
import { RuntimeLogger } from "../src/runtime/RuntimeLogger.ts";

class DummyLogger extends Logger {
    #debugCount = 0;

    get debutCount() {
        return this.#debugCount;
    }

    debug(): Promise<unknown> {
        this.#debugCount += 1;

        return Promise.resolve();
    }

    information(): Promise<unknown> {
        throw new Error("Method not implemented.");
    }

    warning(): Promise<unknown> {
        throw new Error("Method not implemented.");
    }

    error(): Promise<unknown> {
        throw new Error("Method not implemented.");
    }

    critical(): Promise<unknown> {
        throw new Error("Method not implemented.");
    }
}

class DummyRuntime extends Runtime<unknown, unknown> {
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
}

test.concurrent("log to all the provided loggers", ({ expect }) => {
    const logger1 = new DummyLogger("Logger-1", new DummyRuntime());
    const logger2 = new DummyLogger("Logger-2", new DummyRuntime());
    const logger3 = new DummyLogger("Logger-3", new DummyRuntime());

    const runtimeLogger = new RuntimeLogger([logger1, logger2, logger3]);

    runtimeLogger.debug("This is a log!");

    expect(logger1.debutCount).toBe(1);
    expect(logger2.debutCount).toBe(1);
    expect(logger3.debutCount).toBe(1);
});

describe("use", () => {
    test.concurrent("only log to the specified loggers", ({ expect }) => {
        const logger1 = new DummyLogger("Logger-1", new DummyRuntime());
        const logger2 = new DummyLogger("Logger-2", new DummyRuntime());
        const logger3 = new DummyLogger("Logger-3", new DummyRuntime());

        const runtimeLogger = new RuntimeLogger([logger1, logger2, logger3]);
        const scopedLogger = runtimeLogger.use(["Logger-1", "Logger-3"]);

        scopedLogger.debug("This is a log!");

        expect(logger1.debutCount).toBe(1);
        expect(logger2.debutCount).toBe(0);
        expect(logger3.debutCount).toBe(1);
    });
});
