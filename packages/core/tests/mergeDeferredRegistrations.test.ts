import { test, vi } from "vitest";
import { mergeDeferredRegistrations } from "../src/registration/mergeDeferredRegistrations.ts";
import type { DeferredRegistrationFunction } from "../src/registration/registerModule.ts";

function noop() {}

test.concurrent("when deferred registrations are provided, all the deferred registrations are called", async ({ expect }) => {
    const fct1: DeferredRegistrationFunction = vi.fn();
    const fct2: DeferredRegistrationFunction = vi.fn();
    const fct3: DeferredRegistrationFunction = vi.fn();

    const mergeFunction = mergeDeferredRegistrations([fct1, fct2, fct3]);

    await mergeFunction!("foo", "register");

    expect(fct1).toHaveBeenCalledTimes(1);
    expect(fct2).toHaveBeenCalledTimes(1);
    expect(fct3).toHaveBeenCalledTimes(1);
});

test.concurrent("when deferred registrations are provided, all the deferred registrations are called with the provided data and state", async ({ expect }) => {
    const fct1: DeferredRegistrationFunction<string> = vi.fn();
    const fct2: DeferredRegistrationFunction<string> = vi.fn();
    const fct3: DeferredRegistrationFunction<string> = vi.fn();

    const mergeFunction = mergeDeferredRegistrations([fct1, fct2, fct3]);

    await mergeFunction!("foo", "register");

    expect(fct1).toHaveBeenCalledWith("foo", "register");
    expect(fct2).toHaveBeenCalledWith("foo", "register");
    expect(fct3).toHaveBeenCalledWith("foo", "register");
});

test.concurrent("when void results are provided, the void results are ignored", async ({ expect }) => {
    const fct1: DeferredRegistrationFunction<string> = vi.fn();
    const fct2: DeferredRegistrationFunction<string> = vi.fn();

    const mergeFunction = mergeDeferredRegistrations([noop(), fct1, noop(), fct2]);

    await mergeFunction!("foo", "register");

    expect(fct1).toHaveBeenCalledWith("foo", "register");
    expect(fct2).toHaveBeenCalledWith("foo", "register");
});

test.concurrent("when no deferred registrations are provided, return undefined", ({ expect }) => {
    const mergeFunction = mergeDeferredRegistrations([noop(), noop()]);

    expect(mergeFunction).toBeUndefined();
});

test.concurrent("when a single deferred registration is provided, the deferred registration is called", async ({ expect }) => {
    const fct: DeferredRegistrationFunction<string> = vi.fn();

    const mergeFunction = mergeDeferredRegistrations([fct]);

    await mergeFunction!("foo", "register");

    expect(fct).toHaveBeenCalledWith("foo", "register");
});

test.concurrent("when a single deferred registration is provided, return the deferred registration", async ({ expect }) => {
    const fct: DeferredRegistrationFunction<string> = () => {};

    const mergeFunction = mergeDeferredRegistrations([fct]);

    expect(mergeFunction).toBe(fct);
});
