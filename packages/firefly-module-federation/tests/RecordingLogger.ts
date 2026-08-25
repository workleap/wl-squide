import type { LoggerScope, LoggerScopeEndOptions, RootLogger } from "@workleap/logging";

// Records every log and every scope end as it happens, in order.
//
// Writing through rather than buffering until "end()" is the load-bearing property here. Both loggers that
// implement a scope today, "@workleap/logging" and "@workleap/logrocket", queue a scope's logs and flush them
// from "end()", and both ignore a second "end()" call. A log written to an already ended scope is therefore
// dropped, and that is what hid the success log the registries used to write after a failed registration: it
// was written, then thrown away. Recording each log as it is written is what makes the defect observable.
//
// Scope ends are recorded as "end:<color>" because a registry relies on "end()" to flush its scope. A missing
// end is as much of a defect as a spurious log, and only the recorded ends can tell the two apart.
class RecordingLoggerScope implements LoggerScope {
    readonly #logs: string[];

    #segments: string[] = [];

    constructor(logs: string[]) {
        this.#logs = logs;
    }

    #write(log?: string) {
        const segments = this.#segments;

        this.#segments = [];

        if (log) {
            segments.push(log);
        }

        if (segments.length > 0) {
            this.#logs.push(segments.join(" "));
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

        this.#logs.push(`end:${options.labelStyle?.color ?? "none"}`);
    }
}

export class RecordingLogger implements RootLogger {
    readonly logs: string[] = [];

    #segments: string[] = [];

    #write(log?: string) {
        const segments = this.#segments;

        this.#segments = [];

        if (log) {
            segments.push(log);
        }

        if (segments.length > 0) {
            this.logs.push(segments.join(" "));
        }
    }

    getName() {
        return RecordingLogger.name;
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

    // A registry starts one scope per module. Each scope keeps its own segments, so concurrent registrations
    // cannot splice each other's logs, and they all record into the same ordered list.
    startScope() {
        return new RecordingLoggerScope(this.logs);
    }

    // Registration happens in phases, and a test usually asserts on a single one. Clearing between phases keeps
    // the counted logs of the phase under test separate from those of its setup.
    clear() {
        this.logs.length = 0;
    }
}
