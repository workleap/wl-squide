---
order: 350
---

# Register plugins

To keep Squide lightweight, not all functionalities should be integrated as a core functionality. However, to accommodate a broad range of technologies, a [plugin system](http://localhost:5001/wl-squide/reference/plugins/plugin/) has been implemented to fill the gap.

## Register a plugin

Plugins can be registered at bootstrapping with the [initializeFirefly](../reference//registration/initializeFirefly.md) function:

```ts !#5
import { initializeFirefly } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const runtime = initializeFirefly({
    plugins: [x => new MyPlugin(x)]
});
```

## Retrieve a plugin

Using the [usePlugin](../reference/plugins/usePlugin.md) hook:

```ts !#4
import { usePlugin } from "@squide/firefly";
import { MyPlugin } from "@sample/my-plugin";

const myPlugin = usePlugin(MyPlugin.name) as MyPlugin;
```

Using the runtime instance:

```ts !#4
import { MyPlugin } from "@sample/my-plugin";

// If the plugin isn't registered, an error is thrown.
const plugin = runtime.getPlugin(MyPlugin.name) as MyPlugin;
```

## React to deferred registrations

A plugin exposing its own registry to modules must handle the fact that [deferred registrations](./register-deferred-nav-items.md#deferred-registrations-run-again-on-every-update) run again on every update. Squide discards the navigation items registered by the previous run before replaying the new one, but it can't do the same for a plugin registry it knows nothing about, so the entries registered by a previous run would outlive the condition that registered them.

Implement the optional [onDeferredRegistrationScopeStarted](../reference/plugins/Plugin.md#react-to-deferred-registrations) hook to clear and replay a plugin registry along with the run:

```ts !#18-35,37-40 my-plugin/src/myPlugin.ts
import { Plugin, type DeferredRegistrationScopeOptions, type Runtime } from "@squide/firefly";

export interface MyEntry {
    id: string;
}

export class MyPlugin extends Plugin {
    // The entries registered by a deferred registration run, replaced on every run.
    #deferredEntries: MyEntry[] = [];

    // Where the active run writes, "undefined" when no run is active.
    #scopeEntries: MyEntry[] | undefined;

    constructor(runtime: Runtime) {
        super(MyPlugin.name, runtime);
    }

    onDeferredRegistrationScopeStarted({ transactional }: DeferredRegistrationScopeOptions) {
        // Executed before any module's deferred registration function.
        const scopeEntries: MyEntry[] = [];

        if (!transactional) {
            // The initial run writes through, it must not buffer.
            this.#deferredEntries = scopeEntries;
        }

        this.#scopeEntries = scopeEntries;

        return () => {
            // Executed once every deferred registration function has settled. An update run
            // commits here, which is what keeps the previous entries readable until then.
            this.#deferredEntries = scopeEntries;
            this.#scopeEntries = undefined;
        };
    }

    registerEntry(entry: MyEntry) {
        // An active scope means the call comes from a module's deferred registration function.
        this.#scopeEntries?.push(entry);
    }
}
```

The `transactional` branch matters: the initial run must write through because the modules become ready while that scope is still open, so anything rendering at that point must already see the entries.

This example only accepts entries registered from a deferred registration function. For a complete implementation, including how to keep the entries registered outside of a run, refer to the [Plugin](../reference/plugins/Plugin.md#react-to-deferred-registrations) reference documentation.
