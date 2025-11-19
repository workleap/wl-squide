import { NoopLogger } from "@workleap/logging";
import { afterEach, test } from "vitest";
import { __resetHasExecutedGuard, initializeFirefly } from "../src/initializeFirefly.ts";

afterEach(() => {
    __resetHasExecutedGuard();
});

test("when the function is called twice, throw an error", ({ expect }) => {
    initializeFirefly({
        loggers: [new NoopLogger()]
    });

    expect(() => initializeFirefly({ loggers: [new NoopLogger()] })).toThrow(/A squide application can only be initialized once. Did you call the "initializeSquide" function twice?/);
});
