import { Runtime, toLocalModuleDefinitions, type ModuleRegisterFunction } from "@squide/core";
import { NoopLogger } from "@workleap/logging";
import i18n, { type Resource, type ResourceLanguage } from "i18next";
import { describe, test, vi } from "vitest";
import { I18nextResourcesLoadFailedEvent, i18nextPlugin } from "../src/i18nextPlugin.ts";
import { isI18nextResourcesLoadError } from "../src/I18nextResourcesLoadError.ts";

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

    get logger() {
        return new NoopLogger();
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

type LanguageKey = "en-US" | "fr-CA";

function createPlugin(runtime: Runtime = new DummyRuntime(), { detect = true } = {}) {
    const plugin = new i18nextPlugin<LanguageKey>(runtime, ["en-US", "fr-CA"], "en-US", "language");

    if (detect) {
        // Without a navigator language matching a supported language, the fallback language is detected.
        plugin.detectUserLanguage();
    }

    return plugin;
}

// Initialized with "resources: {}" so that i18next initializes synchronously and creates its store.
function createInstance(language: LanguageKey, resources: Resource = {}) {
    const instance = i18n.createInstance();

    instance.init({
        lng: language,
        resources
    });

    return instance;
}

function createDeferred<T = ResourceLanguage>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

async function registerModules(runtime: Runtime) {
    await runtime.moduleManager.registerModules([]);
}

// Flushes the microtasks queued by a resolved loader.
async function flushPromises() {
    await new Promise(resolve => setTimeout(resolve, 0));
}

describe.concurrent("registerInstance", () => {
    test.concurrent("when a loader is provided and the instance doesn't hold the current language, the loader is called with the current language", ({ expect }) => {
        const plugin = createPlugin();

        const loadResources = vi.fn(() => Promise.resolve({ ns: { key: "value" } }));

        plugin.registerInstance("an-instance", createInstance("en-US"), { loadResources });

        expect(loadResources).toHaveBeenCalledExactlyOnceWith("en-US");
    });

    test.concurrent("when a loader is provided and the instance already holds the current language, the loader is not called", ({ expect }) => {
        const plugin = createPlugin();

        const loadResources = vi.fn(() => Promise.resolve({}));

        plugin.registerInstance("an-instance", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), { loadResources });

        expect(loadResources).not.toHaveBeenCalled();
    });

    test.concurrent("when the loaded bundles are resolved, they are added to the instance", async ({ expect }) => {
        const plugin = createPlugin();
        const instance = createInstance("en-US");

        plugin.registerInstance("an-instance", instance, {
            loadResources: () => Promise.resolve({
                ns1: { key1: "value1" },
                ns2: { key2: "value2" }
            })
        });

        await flushPromises();

        expect(instance.getResourceBundle("en-US", "ns1")).toEqual({ key1: "value1" });
        expect(instance.getResourceBundle("en-US", "ns2")).toEqual({ key2: "value2" });
        expect(instance.t("ns1:key1")).toBe("value1");
    });

    test.concurrent("when the loaded bundles are empty, the language is considered loaded", async ({ expect }) => {
        const plugin = createPlugin();

        const loadResources = vi.fn(() => Promise.resolve({}));

        plugin.registerInstance("an-instance", createInstance("en-US"), { loadResources });

        await flushPromises();

        // A second switch to the same language must not load again.
        await plugin.changeLanguage("fr-CA");
        await plugin.changeLanguage("en-US");

        expect(loadResources).toHaveBeenCalledTimes(2);
        expect(loadResources).toHaveBeenNthCalledWith(1, "en-US");
        expect(loadResources).toHaveBeenNthCalledWith(2, "fr-CA");
    });

    test.concurrent("when the loaded language is the instance language, the language is re-applied to the instance", async ({ expect }) => {
        const plugin = createPlugin();
        const instance = createInstance("en-US");

        const changeLanguageSpy = vi.spyOn(instance, "changeLanguage");

        plugin.registerInstance("an-instance", instance, {
            loadResources: () => Promise.resolve({ ns: { key: "value" } })
        });

        await flushPromises();

        expect(changeLanguageSpy).toHaveBeenCalledExactlyOnceWith("en-US");
    });

    test.concurrent("when the loaded language is not the instance language, the language is not re-applied to the instance", async ({ expect }) => {
        const plugin = createPlugin();
        const instance = createInstance("en-US", { "en-US": { ns: { key: "value" } } });

        const changeLanguageSpy = vi.spyOn(instance, "changeLanguage");

        plugin.registerInstance("an-instance", instance, {
            loadResources: () => Promise.resolve({ ns: { key: "valeur" } })
        });

        await plugin.changeLanguage("fr-CA");

        // Only the switch itself applies the language, not the load.
        expect(changeLanguageSpy).toHaveBeenCalledExactlyOnceWith("fr-CA");
    });

    test.concurrent("when the modules are registered, throw an error", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        await registerModules(runtime);

        expect(() => plugin.registerInstance("an-instance", createInstance("en-US"))).toThrow(/once the modules are registered/);
    });

    test.concurrent("when a loader is provided but no language has been detected, throw an error", ({ expect }) => {
        const plugin = createPlugin(new DummyRuntime(), { detect: false });

        expect(() => plugin.registerInstance("an-instance", createInstance("en-US"), {
            loadResources: () => Promise.resolve({})
        })).toThrow(/no user language has been detected/);
    });

    test.concurrent("when a loader is provided but the instance is not initialized, throw an error", ({ expect }) => {
        const plugin = createPlugin();

        expect(() => plugin.registerInstance("an-instance", i18n.createInstance(), {
            loadResources: () => Promise.resolve({})
        })).toThrow(/hasn't been initialized/);
    });

    test.concurrent("when a loader is provided but the instance is initialized without a \"resources\" option, throw an error", ({ expect }) => {
        const plugin = createPlugin();

        // Without "resources", i18next initializes asynchronously.
        const instance = i18n.createInstance();
        instance.init({ lng: "en-US" });

        expect(() => plugin.registerInstance("an-instance", instance, {
            loadResources: () => Promise.resolve({})
        })).toThrow(/without a "resources" option/);
    });

    test.concurrent("when a loader is provided and the instance is initialized without a \"resources\" option but with \"initAsync: false\", do not throw", ({ expect }) => {
        const plugin = createPlugin();

        const instance = i18n.createInstance();
        instance.init({ lng: "en-US", initAsync: false });

        expect(() => plugin.registerInstance("an-instance", instance, {
            loadResources: () => Promise.resolve({})
        })).not.toThrow();
    });

    test.concurrent("when a static instance is registered without a language detected, do not throw", ({ expect }) => {
        const plugin = createPlugin(new DummyRuntime(), { detect: false });

        expect(() => plugin.registerInstance("an-instance", createInstance("en-US"))).not.toThrow();
    });
});

describe.concurrent("changeLanguage", () => {
    test.concurrent("when lazy instances don't hold the language, the switch waits for every load", async ({ expect }) => {
        const plugin = createPlugin();

        const instance1 = createInstance("en-US", { "en-US": { ns: { key: "value" } } });
        const instance2 = createInstance("en-US", { "en-US": { ns: { key: "value" } } });

        const deferred1 = createDeferred();
        const deferred2 = createDeferred();

        plugin.registerInstance("instance-1", instance1, { loadResources: () => deferred1.promise });
        plugin.registerInstance("instance-2", instance2, { loadResources: () => deferred2.promise });

        const listener = vi.fn();

        plugin.registerLanguageChangedListener(listener);

        const promise = plugin.changeLanguage("fr-CA");

        deferred1.resolve({ ns: { key: "valeur" } });

        await flushPromises();

        expect(plugin.currentLanguage).toBe("en-US");
        expect(listener).not.toHaveBeenCalled();

        deferred2.resolve({ ns: { key: "valeur" } });

        await promise;

        expect(plugin.currentLanguage).toBe("fr-CA");
        expect(instance1.language).toBe("fr-CA");
        expect(instance2.language).toBe("fr-CA");
        expect(instance2.t("ns:key")).toBe("valeur");
        expect(listener).toHaveBeenCalledOnce();
    });

    test.concurrent("when only static instances are registered, the switch is observable synchronously", ({ expect }) => {
        const plugin = createPlugin();

        const instance = createInstance("en-US", {
            "en-US": { ns: { key: "value" } },
            "fr-CA": { ns: { key: "valeur" } }
        });

        plugin.registerInstance("an-instance", instance);

        const listener = vi.fn();

        plugin.registerLanguageChangedListener(listener);
        plugin.changeLanguage("fr-CA");

        expect(plugin.currentLanguage).toBe("fr-CA");
        expect(instance.language).toBe("fr-CA");
        expect(listener).toHaveBeenCalledOnce();
    });

    test.concurrent("when a static instance is registered alongside a lazy instance, the static instance is not loaded", async ({ expect }) => {
        const plugin = createPlugin();

        const loadResources = vi.fn(() => Promise.resolve({ ns: { key: "valeur" } }));

        plugin.registerInstance("static", createInstance("en-US", {
            "en-US": { ns: { key: "value" } },
            "fr-CA": { ns: { key: "valeur" } }
        }));

        plugin.registerInstance("lazy", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), { loadResources });

        await plugin.changeLanguage("fr-CA");

        expect(loadResources).toHaveBeenCalledExactlyOnceWith("fr-CA");
    });

    test.concurrent("when a load fails, reject with an I18nextResourcesLoadError and leave the language unchanged", async ({ expect }) => {
        const plugin = createPlugin();

        const instance = createInstance("en-US", { "en-US": { ns: { key: "value" } } });
        const cause = new Error("Network error");

        plugin.registerInstance("an-instance", instance, {
            loadResources: () => Promise.reject(cause)
        });

        const listener = vi.fn();

        plugin.registerLanguageChangedListener(listener);

        const error = await plugin.changeLanguage("fr-CA").catch(x => x);

        expect(isI18nextResourcesLoadError(error)).toBeTruthy();
        expect(error.key).toBe("an-instance");
        expect(error.language).toBe("fr-CA");
        expect(error.cause).toBe(cause);

        expect(plugin.currentLanguage).toBe("en-US");
        expect(instance.language).toBe("en-US");
        expect(listener).not.toHaveBeenCalled();
    });

    test.concurrent("when a load failed, a second call re-invokes the loader", async ({ expect }) => {
        const plugin = createPlugin();

        const loadResources = vi.fn()
            .mockImplementationOnce(() => Promise.reject(new Error("Network error")))
            .mockImplementationOnce(() => Promise.resolve({ ns: { key: "valeur" } }));

        plugin.registerInstance("an-instance", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), { loadResources });

        await expect(plugin.changeLanguage("fr-CA")).rejects.toThrow();
        await expect(plugin.changeLanguage("fr-CA")).resolves.toBeUndefined();

        expect(loadResources).toHaveBeenCalledTimes(2);
        expect(plugin.currentLanguage).toBe("fr-CA");
    });

    test.concurrent("when the language is not supported, reject", async ({ expect }) => {
        const plugin = createPlugin();

        // @ts-expect-error Testing an unsupported language.
        await expect(plugin.changeLanguage("es-ES")).rejects.toThrow(/not part of the supported languages/);
    });

    test.concurrent("when called with the current language, wait for the pending loads without notifying the listeners", async ({ expect }) => {
        const plugin = createPlugin();

        const deferred = createDeferred();
        const instance = createInstance("en-US");

        // Starts the initial load of the current language.
        plugin.registerInstance("an-instance", instance, { loadResources: () => deferred.promise });

        const listener = vi.fn();

        plugin.registerLanguageChangedListener(listener);

        let isResolved = false;

        const promise = plugin.changeLanguage("en-US").then(() => {
            isResolved = true;
        });

        await flushPromises();

        expect(isResolved).toBeFalsy();

        deferred.resolve({ ns: { key: "value" } });

        await promise;

        expect(isResolved).toBeTruthy();
        expect(instance.t("ns:key")).toBe("value");
        expect(listener).not.toHaveBeenCalled();
    });

    test.concurrent("when a more recent call is made while loading, the latest call wins", async ({ expect }) => {
        const plugin = createPlugin();

        const instance = createInstance("en-US");

        const enDeferred = createDeferred();
        const frDeferred = createDeferred();

        plugin.registerInstance("an-instance", instance, {
            loadResources: language => language === "fr-CA" ? frDeferred.promise : enDeferred.promise
        });

        // Settles the initial load of the current language.
        enDeferred.resolve({ ns: { key: "value" } });

        await flushPromises();

        const listener = vi.fn();

        plugin.registerLanguageChangedListener(listener);

        const frPromise = plugin.changeLanguage("fr-CA");
        // The instance already holds "en-US", this call is synchronous and supersedes the previous one.
        const enPromise = plugin.changeLanguage("en-US");

        frDeferred.resolve({ ns: { key: "valeur" } });

        await Promise.all([frPromise, enPromise]);

        expect(plugin.currentLanguage).toBe("en-US");
        expect(instance.language).toBe("en-US");
        // The superseded call resolved without switching.
        expect(listener).not.toHaveBeenCalled();
    });

    test.concurrent("when the same language is requested concurrently, the loader is invoked once", async ({ expect }) => {
        const plugin = createPlugin();

        const deferred = createDeferred();
        const loadResources = vi.fn(() => deferred.promise);

        plugin.registerInstance("an-instance", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), { loadResources });

        const promise1 = plugin.changeLanguage("fr-CA");
        const promise2 = plugin.changeLanguage("fr-CA");

        deferred.resolve({ ns: { key: "valeur" } });

        await Promise.all([promise1, promise2]);

        expect(loadResources).toHaveBeenCalledExactlyOnceWith("fr-CA");
        expect(plugin.currentLanguage).toBe("fr-CA");
    });

    test.concurrent("when a superseded call load fails, resolve without rejecting", async ({ expect }) => {
        const plugin = createPlugin();

        const frDeferred = createDeferred();

        plugin.registerInstance("an-instance", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), {
            loadResources: () => frDeferred.promise
        });

        const frPromise = plugin.changeLanguage("fr-CA");

        // Supersedes the previous call.
        await plugin.changeLanguage("en-US");

        frDeferred.reject(new Error("Network error"));

        await expect(frPromise).resolves.toBeUndefined();
    });
});

describe.concurrent("readiness", () => {
    test.concurrent("when the modules are not registered, the plugin is not ready even without instances", ({ expect }) => {
        const plugin = createPlugin();

        expect(plugin.isReady()).toBeFalsy();
    });

    test.concurrent("when the modules are registered and no instances are registered, the plugin is ready", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        await registerModules(runtime);

        expect(plugin.isReady()).toBeTruthy();
    });

    test.concurrent("when the modules are registered before the language is detected, the plugin is ready and doesn't throw", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime, { detect: false });

        plugin.registerInstance("an-instance", createInstance("en-US"));

        await expect(registerModules(runtime)).resolves.toBeUndefined();

        expect(plugin.isReady()).toBeTruthy();
    });

    test.concurrent("when the initial load of an instance is pending, the plugin is not ready", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const deferred = createDeferred();

        plugin.registerInstance("an-instance", createInstance("en-US"), { loadResources: () => deferred.promise });

        await registerModules(runtime);

        expect(plugin.isReady()).toBeFalsy();
    });

    test.concurrent("when every instance holds the current language, the plugin is ready", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const deferred = createDeferred();

        plugin.registerInstance("static", createInstance("en-US", { "en-US": { ns: { key: "value" } } }));
        plugin.registerInstance("lazy", createInstance("en-US"), { loadResources: () => deferred.promise });

        await registerModules(runtime);

        expect(plugin.isReady()).toBeFalsy();

        deferred.resolve({ ns: { key: "value" } });

        await flushPromises();

        expect(plugin.isReady()).toBeTruthy();
    });

    test.concurrent("when the initial load of an instance fails, the plugin is ready", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const deferred = createDeferred();

        plugin.registerInstance("an-instance", createInstance("en-US"), { loadResources: () => deferred.promise });

        await registerModules(runtime);

        expect(plugin.isReady()).toBeFalsy();

        deferred.reject(new Error("Network error"));

        await flushPromises();

        expect(plugin.isReady()).toBeTruthy();
    });

    test.concurrent("when the language is changed to a language that must be loaded, the plugin is not ready until the switch completes", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const frDeferred = createDeferred();

        plugin.registerInstance("an-instance", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), {
            loadResources: () => frDeferred.promise
        });

        await registerModules(runtime);

        expect(plugin.isReady()).toBeTruthy();

        const promise = plugin.changeLanguage("fr-CA");

        expect(plugin.isReady()).toBeFalsy();

        frDeferred.resolve({ ns: { key: "valeur" } });

        await promise;

        expect(plugin.currentLanguage).toBe("fr-CA");
        expect(plugin.isReady()).toBeTruthy();
    });

    test.concurrent("when the language is changed to a language that every instance holds, the plugin stays ready", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        plugin.registerInstance("an-instance", createInstance("en-US", {
            "en-US": { ns: { key: "value" } },
            "fr-CA": { ns: { key: "valeur" } }
        }));

        await registerModules(runtime);

        plugin.changeLanguage("fr-CA");

        expect(plugin.isReady()).toBeTruthy();
    });

    test.concurrent("when a pending switch fails, the plugin is ready", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        plugin.registerInstance("an-instance", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), {
            loadResources: () => Promise.reject(new Error("Network error"))
        });

        await registerModules(runtime);

        const promise = plugin.changeLanguage("fr-CA");

        expect(plugin.isReady()).toBeFalsy();

        await expect(promise).rejects.toThrow();

        // The language is unchanged and its resources are held, the application can render.
        expect(plugin.currentLanguage).toBe("en-US");
        expect(plugin.isReady()).toBeTruthy();
    });

    test.concurrent("when a pending switch is superseded by a synchronous switch, the plugin is ready right away", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const frDeferred = createDeferred();

        plugin.registerInstance("an-instance", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), {
            loadResources: () => frDeferred.promise
        });

        await registerModules(runtime);

        const frPromise = plugin.changeLanguage("fr-CA");

        expect(plugin.isReady()).toBeFalsy();

        // The instance already holds "en-US", this call is synchronous and supersedes the pending one.
        await plugin.changeLanguage("en-US");

        expect(plugin.isReady()).toBeTruthy();

        frDeferred.resolve({ ns: { key: "valeur" } });

        await frPromise;

        expect(plugin.currentLanguage).toBe("en-US");
        expect(plugin.isReady()).toBeTruthy();
    });

    test.concurrent("when the language changes to a fully loaded language while the initial load is still pending, the plugin is ready", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        // The detected language load never settles, the preferred language load does. This is the
        // "preferred language differs from the detected language" path of a host's deferred registration.
        const enDeferred = createDeferred();
        const frDeferred = createDeferred();

        plugin.registerInstance("an-instance", createInstance("en-US"), {
            loadResources: language => language === "fr-CA" ? frDeferred.promise : enDeferred.promise
        });

        await registerModules(runtime);

        expect(plugin.isReady()).toBeFalsy();

        const promise = plugin.changeLanguage("fr-CA");

        frDeferred.resolve({ ns: { key: "valeur" } });

        await promise;

        expect(plugin.currentLanguage).toBe("fr-CA");
        expect(plugin.isReady()).toBeTruthy();
    });

    test.concurrent("when the plugin becomes ready, the ready listeners are called on each transition to ready", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const enDeferred = createDeferred();
        const frDeferred = createDeferred();

        plugin.registerInstance("an-instance", createInstance("en-US"), {
            loadResources: language => language === "fr-CA" ? frDeferred.promise : enDeferred.promise
        });

        const listener = vi.fn();

        plugin.registerReadyListener(listener);

        await registerModules(runtime);

        expect(listener).not.toHaveBeenCalled();

        enDeferred.resolve({ ns: { key: "value" } });

        await flushPromises();

        expect(listener).toHaveBeenCalledOnce();

        // A switch loading resources makes the plugin not ready, then ready again once the switch completes.
        const promise = plugin.changeLanguage("fr-CA");

        expect(listener).toHaveBeenCalledOnce();

        frDeferred.resolve({ ns: { key: "valeur" } });

        await promise;

        expect(listener).toHaveBeenCalledTimes(2);
    });

    test.concurrent("when a ready listener is removed, it is not called", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const listener = vi.fn();

        plugin.registerReadyListener(listener);
        plugin.removeReadyListener(listener);

        await registerModules(runtime);

        expect(plugin.isReady()).toBeTruthy();
        expect(listener).not.toHaveBeenCalled();
    });
});

describe.concurrent("failure reporting", () => {
    test.concurrent("when the initial load fails, I18nextResourcesLoadFailedEvent is dispatched with the key, the language and the error", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const listener = vi.fn();

        runtime.eventBus.addListener(I18nextResourcesLoadFailedEvent, listener);

        const cause = new Error("Network error");

        plugin.registerInstance("an-instance", createInstance("en-US"), {
            loadResources: () => Promise.reject(cause)
        });

        await flushPromises();

        expect(listener).toHaveBeenCalledExactlyOnceWith({
            key: "an-instance",
            language: "en-US",
            error: cause
        });
    });

    test.concurrent("when a changeLanguage load fails, I18nextResourcesLoadFailedEvent is dispatched", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const listener = vi.fn();

        runtime.eventBus.addListener(I18nextResourcesLoadFailedEvent, listener);

        plugin.registerInstance("an-instance", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), {
            loadResources: () => Promise.reject(new Error("Network error"))
        });

        await plugin.changeLanguage("fr-CA").catch(() => {});

        expect(listener).toHaveBeenCalledOnce();
        expect(listener.mock.calls[0][0]).toMatchObject({ key: "an-instance", language: "fr-CA" });
    });

    test.concurrent("when changeLanguage rejects in a deferred registration function, the error is reported as a ModuleRegistrationError caused by an I18nextResourcesLoadError", async ({ expect }) => {
        const runtime = new DummyRuntime();
        const plugin = createPlugin(runtime);

        const register: ModuleRegisterFunction<Runtime> = () => {
            plugin.registerInstance("an-instance", createInstance("en-US", { "en-US": { ns: { key: "value" } } }), {
                loadResources: () => Promise.reject(new Error("Network error"))
            });

            return async () => {
                await plugin.changeLanguage("fr-CA");
            };
        };

        const registrationErrors = await runtime.moduleManager.registerModules(toLocalModuleDefinitions([register]));

        expect(registrationErrors).toHaveLength(0);

        // This is what "useDeferredRegistrations" forwards to its "onError" callback.
        const deferredRegistrationErrors = await runtime.moduleManager.registerDeferredRegistrations();

        expect(deferredRegistrationErrors).toHaveLength(1);
        expect(isI18nextResourcesLoadError(deferredRegistrationErrors[0].cause)).toBeTruthy();

        // The registry still becomes ready, so does the plugin.
        expect(runtime.moduleManager.getAreModulesReady()).toBeTruthy();
        expect(plugin.isReady()).toBeTruthy();
    });
});
