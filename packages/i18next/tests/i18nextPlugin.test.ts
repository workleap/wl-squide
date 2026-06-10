import { Runtime } from "@squide/core";
import { test, vi } from "vitest";
import { i18nextPlugin } from "../src/i18nextPlugin.ts";

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
    }

    completeDeferredRegistrationScope(): void {
    }

    startScope(): Runtime {
        return new DummyRuntime();
    }

    _validateRegistrations(): void {
        throw new Error("Method not implemented.");
    }
}

test.concurrent("when the language is changed, the registered language changed listeners are called", ({ expect }) => {
    const plugin = new i18nextPlugin(new DummyRuntime(), ["en-US", "fr-CA"], "en-US", "language");

    const listener = vi.fn();

    plugin.registerLanguageChangedListener(listener);
    plugin.changeLanguage("fr-CA");

    expect(listener).toHaveBeenCalledTimes(1);
});

test.concurrent("when the language is changed to the current language, the registered language changed listeners are not called", ({ expect }) => {
    const plugin = new i18nextPlugin(new DummyRuntime(), ["en-US", "fr-CA"], "en-US", "language");

    plugin.changeLanguage("fr-CA");

    const listener = vi.fn();

    plugin.registerLanguageChangedListener(listener);
    plugin.changeLanguage("fr-CA");

    expect(listener).not.toHaveBeenCalled();
});

test.concurrent("when a language changed listener is removed, it is not called anymore", ({ expect }) => {
    const plugin = new i18nextPlugin(new DummyRuntime(), ["en-US", "fr-CA"], "en-US", "language");

    const listener = vi.fn();

    plugin.registerLanguageChangedListener(listener);
    plugin.removeLanguageChangedListener(listener);
    plugin.changeLanguage("fr-CA");

    expect(listener).not.toHaveBeenCalled();
});
