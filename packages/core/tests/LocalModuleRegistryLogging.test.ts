import { NoopLogger } from "@workleap/logging";
import { describe, test } from "vitest";
import { LocalModuleRegistry, LocalModulesDeferredRegistrationCompletedEvent, LocalModulesDeferredRegistrationsUpdateCompletedEvent, LocalModulesRegistrationCompletedEvent } from "../src/registration/LocalModuleRegistry.ts";
import type { DeferredRegistrationFunction, DeferredRegistrationOperation, ModuleRegisterFunction } from "../src/registration/registerModule.ts";
import { Runtime } from "../src/runtime/Runtime.ts";
import { type RecordedScope, ScopeRecordingLogger } from "./ScopeRecordingLogger.ts";

// The success log of a registration loop used to sit after the "try/catch" instead of inside the "try", so a
// module that failed was logged as an error and then, immediately after, as a success. The example-based tests
// pin one failure next to one success per loop. These pin the structure instead: over every combination of
// failing and succeeding modules, the logs a loop produces must always satisfy the same three invariants.
//
// The invariants are what makes this resistant to the shape of the defect rather than tied to it. Moving a
// success log back below its "catch" breaks them for every mask that has a failure at that site, and deleting
// an "end()" breaks them for every mask, whereas an assertion on log text alone observes neither.
const MODULE_COUNT = 4;

// Every combination of which modules fail, from "all succeed" (0) to "all fail" (15).
const FAILURE_MASKS = Array.from({ length: 2 ** MODULE_COUNT }, (_, mask) => mask);

function fails(mask: number, index: number) {
    return (mask & (1 << index)) !== 0;
}

function describeMask(mask: number) {
    const failing = Array.from({ length: MODULE_COUNT }, (_, i) => i).filter(i => fails(mask, i));

    if (failing.length === 0) {
        return "no module fails";
    }

    if (failing.length === MODULE_COUNT) {
        return "every module fails";
    }

    return `module${failing.length !== 1 ? "s" : ""} ${failing.map(i => i + 1).join(", ")} fail${failing.length !== 1 ? "" : "s"}`;
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

    getNavigationItemsByMenu() {
        return new Map();
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

// Reduces the recorded scopes to the handful of numbers the invariants are about, so a test can assert the whole
// shape in one comparison and read the difference straight off a failure.
//
// The numbers only pin the defect as a set. The success count catches a success written on the error path; the
// end count catches the "end()" that moves with it, which no assertion on log text can see; and the "both" and
// "neither" counts catch a success attributed to a module that actually failed, which the totals alone would let
// through whenever a mask has as many successes as failures.
//
// "errorLog" is matched as a substring because a loop may prefix its error with the module index ("1/4").
function summarize(scopes: RecordedScope[], successLog: string, errorLog: string) {
    const outcomes = scopes.map(scope => ({
        succeeded: scope.logs.some(x => x.includes(successLog)),
        failed: scope.logs.some(x => x.includes(errorLog)),
        ends: scope.ends
    }));

    return {
        scopeCount: outcomes.length,
        successCount: outcomes.filter(x => x.succeeded).length,
        errorCount: outcomes.filter(x => x.failed).length,
        scopesEndingExactlyOnce: outcomes.filter(x => x.ends.length === 1).length,
        scopesReportingBothOutcomes: outcomes.filter(x => x.succeeded && x.failed).length,
        scopesReportingNeitherOutcome: outcomes.filter(x => !x.succeeded && !x.failed).length,
        // A red scope carrying a success line, or a green one carrying an error, is the defect wearing the
        // opposite colour.
        scopesWhoseEndColorDisagrees: outcomes.filter(x => x.ends[0] !== (x.succeeded ? "green" : "red")).length
    };
}

// What "summarize" must return for a phase in which "expectedFailureCount" of the modules failed.
function expectedSummary(expectedFailureCount: number) {
    return {
        scopeCount: MODULE_COUNT,
        successCount: MODULE_COUNT - expectedFailureCount,
        errorCount: expectedFailureCount,
        scopesEndingExactlyOnce: MODULE_COUNT,
        scopesReportingBothOutcomes: 0,
        scopesReportingNeitherOutcome: 0,
        scopesWhoseEndColorDisagrees: 0
    };
}

function createRegistrationFunctions(mask: number): ModuleRegisterFunction<Runtime>[] {
    return Array.from({ length: MODULE_COUNT }, (_, index) => () => {
        if (fails(mask, index)) {
            throw new Error(`Module ${index + 1} registration failed.`);
        }
    });
}

// Registration functions that all succeed, each returning a deferred registration that fails per the mask for
// the requested modes. A deferred function is called once with "register" and again with "update", so failing
// only on "update" is what isolates the update loop from the registration one.
function createDeferredRegistrationFunctions(mask: number, failingModes: DeferredRegistrationOperation[]): ModuleRegisterFunction<Runtime>[] {
    return Array.from({ length: MODULE_COUNT }, (_, index) => () => {
        const deferredRegister: DeferredRegistrationFunction = (_runtime, _data, mode) => {
            if (fails(mask, index) && failingModes.includes(mode)) {
                throw new Error(`Module ${index + 1} deferred registration failed on "${mode}".`);
            }
        };

        return deferredRegister;
    });
}

function countFailures(mask: number) {
    return Array.from({ length: MODULE_COUNT }, (_, i) => i).filter(i => fails(mask, i)).length;
}

describe.concurrent("registerModules logging", () => {
    for (const mask of FAILURE_MASKS) {
        test.concurrent(`when ${describeMask(mask)}, the logs of every module scope stay consistent`, async ({ expect }) => {
            const logger = new ScopeRecordingLogger();
            const runtime = new DummyRuntime({ loggers: [logger] });
            const registry = new LocalModuleRegistry();

            let completedCount = -1;

            runtime.eventBus.addListener(LocalModulesRegistrationCompletedEvent, (payload: unknown) => {
                completedCount = (payload as { moduleCount: number }).moduleCount;
            });

            await registry.registerModules(runtime, createRegistrationFunctions(mask));

            const failureCount = countFailures(mask);

            expect(summarize(logger.scopes, "[squide] Successfully registered local module.", "An error occured while registering the local module.")).toEqual(expectedSummary(failureCount));
            expect(completedCount).toBe(MODULE_COUNT - failureCount);
        });
    }
});

describe.concurrent("registerDeferredRegistrations logging", () => {
    for (const mask of FAILURE_MASKS) {
        test.concurrent(`when ${describeMask(mask)}, the logs of every deferred registration scope stay consistent`, async ({ expect }) => {
            const logger = new ScopeRecordingLogger();
            const runtime = new DummyRuntime({ loggers: [logger] });
            const registry = new LocalModuleRegistry();

            let completedCount = -1;

            runtime.eventBus.addListener(LocalModulesDeferredRegistrationCompletedEvent, (payload: unknown) => {
                completedCount = (payload as { registrationCount: number }).registrationCount;
            });

            await registry.registerModules(runtime, createDeferredRegistrationFunctions(mask, ["register"]));

            // The module registration phase logged its own scopes, and this asserts on the deferred phase only.
            logger.clear();

            await registry.registerDeferredRegistrations(runtime, {});

            const failureCount = countFailures(mask);

            expect(summarize(logger.scopes, "[squide] Successfully registered deferred registrations.", "An error occured while registering the deferred registrations.")).toEqual(expectedSummary(failureCount));
            expect(completedCount).toBe(MODULE_COUNT - failureCount);
        });
    }
});

describe.concurrent("updateDeferredRegistrations logging", () => {
    for (const mask of FAILURE_MASKS) {
        test.concurrent(`when ${describeMask(mask)}, the logs of every deferred registration update scope stay consistent`, async ({ expect }) => {
            const logger = new ScopeRecordingLogger();
            const runtime = new DummyRuntime({ loggers: [logger] });
            const registry = new LocalModuleRegistry();

            let completedCount = -1;

            runtime.eventBus.addListener(LocalModulesDeferredRegistrationsUpdateCompletedEvent, (payload: unknown) => {
                completedCount = (payload as { registrationCount: number }).registrationCount;
            });

            // Failing on "update" only, so the registry reaches "ready" with every deferred registration intact
            // and the update loop is the one under test.
            await registry.registerModules(runtime, createDeferredRegistrationFunctions(mask, ["update"]));
            await registry.registerDeferredRegistrations(runtime, {});

            logger.clear();

            await registry.updateDeferredRegistrations(runtime, {});

            const failureCount = countFailures(mask);

            expect(summarize(logger.scopes, "[squide] Successfully updated deferred registrations.", "An error occured while updating the deferred registrations.")).toEqual(expectedSummary(failureCount));
            expect(completedCount).toBe(MODULE_COUNT - failureCount);
        });
    }
});
