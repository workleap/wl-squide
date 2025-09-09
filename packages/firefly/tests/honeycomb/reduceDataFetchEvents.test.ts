import { NoopLogger } from "@workleap/logging";
import { test, vi } from "vitest";
import { ProtectedDataReadyEvent, PublicDataReadyEvent } from "../../src/AppRouterReducer.ts";
import { FireflyRuntime } from "../../src/FireflyRuntime.tsx";
import { reduceDataFetchEvents } from "../../src/honeycomb/registerHoneycombInstrumentation.ts";
import { ProtectedDataFetchFailedEvent, ProtectedDataFetchStartedEvent } from "../../src/useProtectedDataQueries.ts";
import { PublicDataFetchFailedEvent, PublicDataFetchStartedEvent } from "../../src/usePublicDataQueries.ts";

test.concurrent("when the state is \"none\" and PublicDataFetchStartedEvent is handled, call the onDataFetchStarted handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"fetching-data\" and PublicDataFetchStartedEvent is handled, do not call the onDataFetchStarted handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Should not call onDataFetchStarted.
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"none\" and ProtectedDataFetchStartedEvent is handled, call the onDataFetchStarted handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"fetching-data\" and ProtectedDataFetchStartedEvent is handled, do not call the onDataFetchStarted handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);

    // Should not call onDataFetchStarted.
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"fetching-data\", \"waitForProtectedData\" is true, and PublicDataReadyEvent is handled, do not call the onDataReadyHandler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Should call onDataReady.
    runtime.eventBus.dispatch(PublicDataReadyEvent, {
        waitForProtectedData: true
    });

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).not.toHaveBeenCalled();
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"fetching-data\", \"waitForProtectedData\" is false, and PublicDataReadyEvent is handled, call the onDataReadyHandler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Should call onDataReady.
    runtime.eventBus.dispatch(PublicDataReadyEvent, {
        waitForProtectedData: false
    });

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"protected-data-ready\" and PublicDataReadyEvent is handled, call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "protected-data-ready".
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    // Should call onDataReady.
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"public-data-ready\" and PublicDataReadyEvent is handled, do not call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "public-data-ready".
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    // Should not call onDataReady.
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(0);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"data-ready\" and PublicDataReadyEvent is handled, do not call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "data-ready".
    runtime.eventBus.dispatch(PublicDataReadyEvent);
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    // Should not call onDataReady again.
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"fetching-data\", \"waitForPublicData\" is true, and ProtectedDataReadyEvent is handled, do not call the onDataReadyHandler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Should call onDataReady.
    runtime.eventBus.dispatch(ProtectedDataReadyEvent, { waitForPublicData: true });

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).not.toHaveBeenCalled();
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"fetching-data\", \"waitForPublicData\" is false, and ProtectedDataReadyEvent is handled, call the onDataReadyHandler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Should call onDataReady.
    runtime.eventBus.dispatch(ProtectedDataReadyEvent, { waitForPublicData: false });

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"public-data-ready\" and ProtectedDataReadyEvent is handled, call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "public-data-ready".
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    // Should call onDataReady.
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"protected-data-ready\" and ProtectedDataReadyEvent is handled, do not call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "protected-data-ready".
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    // Should not call onDataReady.
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(0);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"data-ready\" and ProtectedDataReadyEvent is handled, do not call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "data-ready".
    runtime.eventBus.dispatch(PublicDataReadyEvent);
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    // Should not call onDataReady again.
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    expect(onDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is not \"data-fetch-failed\" and PublicDataFetchFailedEvent is handled, call the onDataFetchFailed handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    runtime.eventBus.dispatch(PublicDataFetchFailedEvent);

    expect(onDataFetchFailed).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"data-fetch-failed\" and PublicDataFetchFailedEvent is handled, call the onDataFetchFailed handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // The first dispatch will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchFailedEvent);
    runtime.eventBus.dispatch(PublicDataFetchFailedEvent);

    expect(onDataFetchFailed).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is not \"data-fetch-failed\" and ProtectedDataFetchFailedEvent is handled, call the onDataFetchFailed handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // The first dispatch will update the state to "fetching-data".
    runtime.eventBus.dispatch(ProtectedDataFetchFailedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchFailedEvent);

    expect(onDataFetchFailed).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"data-fetch-failed\" and ProtectedDataFetchFailedEvent is handled, call the onDataFetchFailed handler", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    runtime.eventBus.dispatch(ProtectedDataFetchFailedEvent);

    expect(onDataFetchFailed).toHaveBeenCalledTimes(1);
});

test.concurrent("events sequencing", ({ expect }) => {
    const runtime = new FireflyRuntime({
        loggers: [new NoopLogger()]
    });

    const onDataFetchStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();
    const onDataFetchFailed = vi.fn();
    const onUnmanagedError = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady,
        onDataFetchFailed,
        onUnmanagedError
    );

    // Expected order is:
    //    onDataFetchStarted
    //    onPublicDataFetchStarted - onProtectedDataFetchStarted
    //    onPublicDataReady - onProtectedDataReady
    //    onDataReady
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);
    runtime.eventBus.dispatch(PublicDataReadyEvent);
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    expect(onDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onDataReady.mock.invocationCallOrder[0]);
});
