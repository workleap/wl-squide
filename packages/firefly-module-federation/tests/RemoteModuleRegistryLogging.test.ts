import { Runtime } from "@squide/core";
import { NoopLogger } from "@workleap/logging";
import { describe, test, vi } from "vitest";
import { RemoteModuleRegistry, RemoteModulesDeferredRegistrationCompletedEvent, RemoteModulesDeferredRegistrationsUpdateCompletedEvent, RemoteModulesRegistrationCompletedEvent } from "../src/RemoteModuleRegistry.ts";
import { type RecordedScope, ScopeRecordingLogger } from "./ScopeRecordingLogger.ts";

// The remote counterpart of "LocalModuleRegistryLogging.test.ts". Same three invariants, same failure masks.
//
// "registerModules" is included even though it never had the defect: it is the site the other five were changed
// to match, so it is the one that has to keep holding. A gate that only covers the sites that were wrong cannot
// tell you the reference stopped being right.
const MODULE_COUNT = 4;

const FAILURE_MASKS = Array.from({ length: 2 ** MODULE_COUNT }, (_, mask) => mask);

function fails(mask: number, index: number) {
    return (mask & (1 << index)) !== 0;
}

function describeMask(mask: number) {
    const failing = Array.from({ length: MODULE_COUNT }, (_, i) => i).filter(i => fails(mask, i));

    if (failing.length === 0) {
        return "no remote fails";
    }

    if (failing.length === MODULE_COUNT) {
        return "every remote fails";
    }

    return `remote${failing.length !== 1 ? "s" : ""} ${failing.map(i => i + 1).join(", ")} fail${failing.length !== 1 ? "" : "s"}`;
}

function countFailures(mask: number) {
    return Array.from({ length: MODULE_COUNT }, (_, i) => i).filter(i => fails(mask, i)).length;
}

const REMOTES = Array.from({ length: MODULE_COUNT }, (_, index) => ({ name: `Dummy-${index + 1}` }));

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

// A "loadRemote" whose modules register successfully but whose deferred registration fails per the mask, for the
// requested operations. Failing only on "update" leaves the registry "ready" with every deferred registration
// intact, which is what isolates the update loop.
function createLoadRemote(mask: number, failingOperations: ("register" | "update")[]) {
    return vi.fn().mockImplementation((remoteName: string) => {
        const index = REMOTES.findIndex(x => x.name === remoteName);

        return Promise.resolve({
            register: () => (_runtime: unknown, _data: unknown, operation: string) => {
                if (fails(mask, index) && failingOperations.includes(operation as "register" | "update")) {
                    throw new Error(`Remote ${index + 1} deferred registration failed on "${operation}".`);
                }
            }
        });
    });
}

describe.concurrent("registerModules logging", () => {
    for (const mask of FAILURE_MASKS) {
        test.concurrent(`when ${describeMask(mask)}, the logs of every remote scope stay consistent`, async ({ expect }) => {
            const logger = new ScopeRecordingLogger();
            const runtime = new DummyRuntime({ loggers: [logger] });

            let completedCount = -1;

            runtime.eventBus.addListener(RemoteModulesRegistrationCompletedEvent, (payload: unknown) => {
                completedCount = (payload as { remoteCount: number }).remoteCount;
            });

            // The failure is raised from the module's own "register", which is inside the loop's "try".
            const loadRemote = vi.fn().mockImplementation((remoteName: string) => {
                const index = REMOTES.findIndex(x => x.name === remoteName);

                return Promise.resolve({
                    register: () => {
                        if (fails(mask, index)) {
                            throw new Error(`Remote ${index + 1} registration failed.`);
                        }
                    }
                });
            });

            const registry = new RemoteModuleRegistry(loadRemote);

            await registry.registerModules(runtime, REMOTES);

            const failureCount = countFailures(mask);

            expect(summarize(logger.scopes, "[squide] Successfully registered remote module.", "An error occured while registering the remote module.")).toEqual(expectedSummary(failureCount));
            expect(completedCount).toBe(MODULE_COUNT - failureCount);
        });
    }
});

describe.concurrent("registerDeferredRegistrations logging", () => {
    for (const mask of FAILURE_MASKS) {
        test.concurrent(`when ${describeMask(mask)}, the logs of every deferred registration scope stay consistent`, async ({ expect }) => {
            const logger = new ScopeRecordingLogger();
            const runtime = new DummyRuntime({ loggers: [logger] });

            let completedCount = -1;

            runtime.eventBus.addListener(RemoteModulesDeferredRegistrationCompletedEvent, (payload: unknown) => {
                completedCount = (payload as { registrationCount: number }).registrationCount;
            });

            const registry = new RemoteModuleRegistry(createLoadRemote(mask, ["register"]));

            await registry.registerModules(runtime, REMOTES);

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

            let completedCount = -1;

            runtime.eventBus.addListener(RemoteModulesDeferredRegistrationsUpdateCompletedEvent, (payload: unknown) => {
                completedCount = (payload as { registrationCount: number }).registrationCount;
            });

            const registry = new RemoteModuleRegistry(createLoadRemote(mask, ["update"]));

            await registry.registerModules(runtime, REMOTES);
            await registry.registerDeferredRegistrations(runtime, {});

            logger.clear();

            await registry.updateDeferredRegistrations(runtime, {});

            const failureCount = countFailures(mask);

            expect(summarize(logger.scopes, "[squide] Successfully updated the deferred registrations.", "An error occured while updating the deferred registrations.")).toEqual(expectedSummary(failureCount));
            expect(completedCount).toBe(MODULE_COUNT - failureCount);
        });
    }
});
