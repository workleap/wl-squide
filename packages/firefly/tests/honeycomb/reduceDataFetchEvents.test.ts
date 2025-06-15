import { test, vi } from "vitest";
import { ProtectedDataReadyEvent, PublicDataReadyEvent } from "../../src/AppRouterReducer.ts";
import { FireflyRuntime } from "../../src/FireflyRuntime.tsx";
import { reduceDataFetchEvents } from "../../src/honeycomb/registerHoneycombInstrumentation.ts";
import { ProtectedDataFetchStartedEvent } from "../../src/useProtectedDataQueries.ts";
import { PublicDataFetchStartedEvent } from "../../src/usePublicDataQueries.ts";

test.concurrent("when the state is \"none\" and PublicDataFetchStartedEvent is handled, call the onDataFetchingStarted handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"fetching-data\" and PublicDataFetchStartedEvent is handled, do not call the onDataFetchingStarted handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Should not call onDataFetchingStarted.
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"none\" and ProtectedDataFetchStartedEvent is handled, call the onDataFetchingStarted handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"fetching-data\" and ProtectedDataFetchStartedEvent is handled, do not call the onDataFetchingStarted handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);

    // Should not call onDataFetchingStarted.
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"protected-data-ready\" and PublicDataReadyEvent is handled, call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "protected-data-ready".
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    // Snould call onDataReady.
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"public-data-ready\" and PublicDataReadyEvent is handled, do not call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "public-data-ready".
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    // Should not call onDataReady.
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(0);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(2);
});

test.concurrent("when the state is \"data-ready\" and PublicDataReadyEvent is handled, do not call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "data-ready".
    runtime.eventBus.dispatch(PublicDataReadyEvent);
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    // Should not call onDataReady again.
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(2);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"public-data-ready\" and ProtectedDataReadyEvent is handled, call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "public-data-ready".
    runtime.eventBus.dispatch(PublicDataReadyEvent);

    // Snould call onDataReady.
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(1);
});

test.concurrent("when the state is \"protected-data-ready\" and ProtectedDataReadyEvent is handled, do not call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "protected-data-ready".
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    // Should not call onDataReady.
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(0);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(2);
});

test.concurrent("when the state is \"data-ready\" and ProtectedDataReadyEvent is handled, do not call the onDataReady handler", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    // Will update the state to "fetching-data".
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);

    // Will update the state to "data-ready".
    runtime.eventBus.dispatch(PublicDataReadyEvent);
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    // Should not call onDataReady again.
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    expect(onDataFetchingStarted).toHaveBeenCalledTimes(1);
    expect(onDataReady).toHaveBeenCalledTimes(1);
    expect(onPublicDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onProtectedDataFetchStarted).toHaveBeenCalledTimes(1);
    expect(onPublicDataReady).toHaveBeenCalledTimes(1);
    expect(onProtectedDataReady).toHaveBeenCalledTimes(2);
});

test.concurrent("events sequencing", ({ expect }) => {
    const runtime = new FireflyRuntime();

    const onDataFetchingStarted = vi.fn();
    const onDataReady = vi.fn();
    const onPublicDataFetchStarted = vi.fn();
    const onPublicDataReady = vi.fn();
    const onProtectedDataFetchStarted = vi.fn();
    const onProtectedDataReady = vi.fn();

    reduceDataFetchEvents(
        runtime,
        onDataFetchingStarted,
        onDataReady,
        onPublicDataFetchStarted,
        onPublicDataReady,
        onProtectedDataFetchStarted,
        onProtectedDataReady
    );

    // Expected order is:
    //    onDataFetchingStarted
    //    onPublicDataFetchStarted - onProtectedDataFetchStarted
    //    onPublicDataReady - onProtectedDataReady
    //    onDataReady
    runtime.eventBus.dispatch(PublicDataFetchStartedEvent);
    runtime.eventBus.dispatch(ProtectedDataFetchStartedEvent);
    runtime.eventBus.dispatch(PublicDataReadyEvent);
    runtime.eventBus.dispatch(ProtectedDataReadyEvent);

    expect(onDataFetchingStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataFetchStarted.mock.invocationCallOrder[0]);
    expect(onDataFetchingStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataFetchStarted.mock.invocationCallOrder[0]);

    expect(onPublicDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onPublicDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataFetchStarted.mock.invocationCallOrder[0]).toBeLessThan(onProtectedDataReady.mock.invocationCallOrder[0]);

    expect(onPublicDataReady.mock.invocationCallOrder[0]).toBeLessThan(onDataReady.mock.invocationCallOrder[0]);
    expect(onProtectedDataReady.mock.invocationCallOrder[0]).toBeLessThan(onDataReady.mock.invocationCallOrder[0]);
});
