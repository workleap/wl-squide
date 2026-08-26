import type { LoggerScope, LoggerScopeEndOptions, RootLogger } from "@workleap/logging";

// A "RecordingLogger" that keeps each scope's logs separate instead of flattening them into one list.
//
// The flat recorder answers "how many success lines were written?". It cannot answer "did a single scope write
// both an error and a success line?", which is the actual invariant: the registries start one scope per module,
// and a module's outcome is either a failure or a success, never both. Attributing logs to their scope is what
// makes that assertable, and it is what tells a spurious success line apart from a legitimate one belonging to
// a different module.
//
// Like "RecordingLogger", this writes each log through as it is called rather than buffering until "end()".
// The loggers that ship today buffer and flush from the first "end()", which silently discards anything written
// to an already ended scope, so a buffering recorder cannot observe the defect at all.
export interface RecordedScope {
    label?: string;
    logs: string[];
    // One entry per "end()" call, holding the label colour. A scope is expected to end exactly once.
    ends: string[];
}

class ScopeRecorder implements LoggerScope {
    readonly #scope: RecordedScope;

    #segments: string[] = [];

    constructor(scope: RecordedScope) {
        this.#scope = scope;
    }

    #write(log?: string) {
        const segments = this.#segments;

        this.#segments = [];

        if (log) {
            segments.push(log);
        }

        if (segments.length > 0) {
            this.#scope.logs.push(segments.join(" "));
        }
    }

    withText(text?: string) {
        if (text) {
            this.#segments.push(text);
        }

        return this;
    }

    withError() {
        return this;
    }

    withObject() {
        return this;
    }

    withLineChange() {
        return this;
    }

    debug(log?: string) {
        this.#write(log);
    }

    information(log?: string) {
        this.#write(log);
    }

    warning(log?: string) {
        this.#write(log);
    }

    error(log?: string) {
        this.#write(log);
    }

    critical(log?: string) {
        this.#write(log);
    }

    end(options: LoggerScopeEndOptions = {}) {
        this.#write();

        this.#scope.ends.push(options.labelStyle?.color ?? "none");
    }
}

export class ScopeRecordingLogger implements RootLogger {
    readonly scopes: RecordedScope[] = [];
    readonly rootLogs: string[] = [];

    #segments: string[] = [];

    #write(log?: string) {
        const segments = this.#segments;

        this.#segments = [];

        if (log) {
            segments.push(log);
        }

        if (segments.length > 0) {
            this.rootLogs.push(segments.join(" "));
        }
    }

    getName() {
        return ScopeRecordingLogger.name;
    }

    withText(text?: string) {
        if (text) {
            this.#segments.push(text);
        }

        return this;
    }

    withError() {
        return this;
    }

    withObject() {
        return this;
    }

    withLineChange() {
        return this;
    }

    debug(log?: string) {
        this.#write(log);
    }

    information(log?: string) {
        this.#write(log);
    }

    warning(log?: string) {
        this.#write(log);
    }

    error(log?: string) {
        this.#write(log);
    }

    critical(log?: string) {
        this.#write(log);
    }

    startScope(label?: string) {
        const scope: RecordedScope = {
            label,
            logs: [],
            ends: []
        };

        this.scopes.push(scope);

        return new ScopeRecorder(scope);
    }

    // A registration phase is asserted on its own, so the scopes of a preceding setup phase have to go.
    clear() {
        this.scopes.length = 0;
        this.rootLogs.length = 0;
    }
}
