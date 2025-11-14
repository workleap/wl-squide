// import { __clearLocalModuleRegistry } from "@squide/core";
// import { __clearRemoteModuleRegistry } from "@squide/module-federation";
import { __clearMswState } from "@squide/msw";
import { NoopLogger } from "@workleap/logging";
import { afterEach, expect, test } from "vitest";
import { __resetHasExecuteGuard, initializeFirefly } from "../src/initializeFirefly.ts";

afterEach(() => {
    // __clearLocalModuleRegistry();
    // __clearRemoteModuleRegistry();
    __clearMswState();
    __resetHasExecuteGuard();
});

test("when the function is called twice, throw an error", () => {
    initializeFirefly({
        loggers: [new NoopLogger()]
    });

    expect(() => initializeFirefly({ loggers: [new NoopLogger()] })).toThrow(/A squide application can only be initialized once. Did you call the "initializeSquide" function twice?/);
});
