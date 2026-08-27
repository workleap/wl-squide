---
order: 100
toc:
    depth: 2-3
---

# Plugin

An abstract base class to define a plugin.

## Parameters

- `runtime`: A runtime instance.

## Protected members

- `_runtime`: Access the plugin `Runtime` instance.

## Getters

- `name`: Return the name of the plugin.

## Optional members

- `onDeferredRegistrationScopeStarted(options)`: Executed when a [deferred registration](../../essentials/register-deferred-nav-items.md) run starts, before any module's deferred registration function executes. Can return a completion function that is executed once the run has settled. See [React to deferred registrations](#react-to-deferred-registrations).

```ts
onDeferredRegistrationScopeStarted?(options: {
    operation: "register" | "update";
    transactional: boolean;
}): (() => void) | void;
```

## Usage

### Define a plugin

```ts !#3-7 my-plugin/src/myPlugin.ts
import { Plugin, type Runtime } from "@squide/firefly";

export class MyPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }
}
```

### Register a plugin

```ts !#5
import { FireflyRuntime } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const runtime = new FireflyRuntime({
    plugins: [x => new MyPlugin(x)]
});
```

### Use a plugin runtime instance

```ts !#9 my-plugin/src/myPlugin.ts
import { Plugin, type Runtime } from "@squide/firefly";

export class MyPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }

    sayHello() {
        this._runtime.logger.debug("Hello!");
    }
}
```

### Retrieve a plugin from a runtime instance

```ts !#3
import { MyPlugin } from "@sample/my-plugin";

const myPlugin = runtime.getPlugin(MyPlugin.name) as MyPlugin;
```

### Retrieve a plugin with a custom function

We recommend pairing a plugin definition with a custom function to retrieve the plugin from a runtime instance.

```ts !#9-11 my-plugin/src/myPlugin.ts
import { Plugin, type Runtime } from "@squide/firefly";

export class MyPlugin extends Plugin {
    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }
}

export function getMyPlugin(runtime: FireflyRuntime) {
    return runtime.getPlugin(MyPlugin.name) as MyPlugin;
}
```

```ts !#3
import { getMyPlugin } from "@sample/my-plugin";

const myPlugin = getMyPlugin(runtime);
```

Retrieving a plugin with a custom function doesn't require the consumer to remember the plugin name, and has the upside of inferring the typings.

### React to deferred registrations

A [deferred registration function](../../essentials/register-deferred-nav-items.md) doesn't run once. It runs again every time the deferred registrations are updated, whenever a feature flag value changes or the data passed to [useDeferredRegistrations](../registration/useDeferredRegistrations.md) changes.

Squide discards the navigation items registered by the previous run before replaying the new one. A plugin that exposes its own registry to modules must do the same, otherwise the entries registered by a previous run outlive the condition that registered them. For example, a plugin registry filled from a deferred registration function guarded by a feature flag keeps its entries after that flag has been turned off.

To make this possible, Squide brackets every deferred registration run with a **scope** and notifies the plugins when that scope starts, by executing their optional `onDeferredRegistrationScopeStarted` hook.

The hook receives an object literal of options:

- `operation`: `"register"` for the initial run, `"update"` for every subsequent update run. Branch on it to skip work that only makes sense once a previous run exists, such as clearing entries.
- `transactional`: `false` for the initial run, `true` for every update run. Branch on it to choose between writing through and buffering, as the example below does.

The hook can return a **completion function**, executed once every module's deferred registration function has settled. Paired with `transactional`, this is what allows a registry to be replaced atomically: buffer the incoming entries as the modules register them, then clear the previous entries and replay the buffer from the completion function.

```ts !#21-43,45-52 my-plugin/src/myPlugin.ts
import { Plugin, type DeferredRegistrationScopeOptions, type Runtime } from "@squide/firefly";

export interface MyEntry {
    id: string;
}

export class MyPlugin extends Plugin {
    // The entries registered outside of a deferred registration run, kept across runs.
    readonly #staticEntries: MyEntry[] = [];

    // The entries registered by a deferred registration run, replaced on every run.
    #deferredEntries: MyEntry[] = [];

    // Where the active run writes, "undefined" when no run is active.
    #scopeEntries: MyEntry[] | undefined;

    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }

    onDeferredRegistrationScopeStarted({ transactional }: DeferredRegistrationScopeOptions) {
        if (!transactional) {
            // The initial run writes through: the modules become "ready" while the scope is still open,
            // and whoever renders at that point must see the entries of the initial run.
            this.#deferredEntries = [];
            this.#scopeEntries = this.#deferredEntries;

            return () => {
                this.#scopeEntries = undefined;
            };
        }

        // An update run buffers instead, so that the previous entries remain readable until the new run
        // has settled.
        const buffer: MyEntry[] = [];

        this.#scopeEntries = buffer;

        return () => {
            this.#deferredEntries = buffer;
            this.#scopeEntries = undefined;
        };
    }

    registerEntry(entry: MyEntry) {
        // An active scope means the call comes from a module's deferred registration function.
        if (this.#scopeEntries) {
            this.#scopeEntries.push(entry);
        } else {
            this.#staticEntries.push(entry);
        }
    }

    get entries() {
        return [...this.#staticEntries, ...this.#deferredEntries];
    }
}
```

!!!warning
Both the hook and the completion function must be **synchronous**. Squide doesn't await them.
!!!

!!!warning
Don't read the runtime's navigation items from a completion function. On an update run, the completion functions execute before Squide commits the navigation items of that run, so [getNavigationItems](../runtime/FireflyRuntime.md#retrieve-navigation-items) still returns the items of the previous run. A completion function should only commit the plugin's own state.
!!!

The completion function is also executed when the run fails, with whatever the modules managed to register before the failure. Squide doesn't roll a failed run back, the navigation items behave the same way. Two consequences worth knowing:

- A module that throws doesn't fail the run. Module errors are collected and reported through the [onError](../registration/useDeferredRegistrations.md#handle-registration-errors) callback of `useDeferredRegistrations` rather than thrown, so a failing module silently drops its own entries for that run, plugin registry and navigation items alike.
- A throwing hook aborts the run before any module executes, but it doesn't leave the application untouched. The completion functions of the plugins already notified still run, and since no module ran, a buffered registry commits empty and the run's deferred navigation items are cleared with nothing to replay. Treat a throwing hook as a bug to fix, not as a way to skip a run.
