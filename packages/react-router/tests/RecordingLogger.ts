import type { LoggerScope, RootLogger } from "@workleap/logging";

// Records the text segments of every completed log so that tests can assert on what the runtime actually
// reported, rather than on the registration results it reported them from. The transactional deferred
// registration scope used to report an accurate result while logging nothing at all, so the two are worth
// asserting separately.
export class RecordingLogger implements RootLogger, LoggerScope {
    readonly logs: string[] = [];

    #segments: string[] = [];

    // Captures both shapes the runtime logs with: the chained "withText(...).debug()" form, and the direct
    // "error(message)" form used by the validation reports.
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

    // The runtime starts a logger scope per module. Recording through the same instance keeps every log in a
    // single ordered list, which is what the assertions care about.
    startScope() {
        return this;
    }

    end() {
        this.#write();
    }
}
