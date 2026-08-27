---
"@squide/core": minor
---

Plugins can now hook into the lifecycle of a deferred registration run, to clear and replay their own registry the way Squide clears and replays its navigation items.

The `Plugin` abstract class gained one optional method:

```ts
onDeferredRegistrationScopeStarted?(options: DeferredRegistrationScopeOptions): DeferredRegistrationScopeCompletionFunction | void;
```

It's optional and unimplemented on the base class, so **no existing plugin needs any change**.

## The problem

A deferred registration function runs again every time the deferred registrations are updated, whenever a feature flag value changes or the data passed to `useDeferredRegistrations` changes. Squide discards the navigation items registered by the previous run before replaying the new one, which is what makes a conditionally registered item disappear once its condition stops holding.

A plugin that exposes its own registry to modules got no such treatment. Nothing told that registry a new run was starting, so an entry registered from a deferred registration function guarded by a feature flag survived that flag being turned off, for the rest of the session. The plugin had no signal to act on either: the initial deferred registration run dispatched no event at all, so a plugin couldn't even tell which of its entries came from a deferred registration function and which came from a module's static registration.

## The hook

`onDeferredRegistrationScopeStarted` is executed when a run starts, before any module's deferred registration function, and receives:

- `operation`: `"register"` for the initial run, `"update"` for every subsequent update run.
- `transactional`: `false` for the initial run, `true` for every update run.

It can return a completion function, executed once every module's deferred registration function has settled, while the runtime's own scope is still open. Buffering the incoming entries during a transactional run and committing them from the completion function is what lets a registry be swapped atomically — readers never observe a half-filled registry, and the commit lands before React is told to re-render.

Both the hook and the completion function must be synchronous. Squide doesn't await them.

## Guarantees

- The hook is executed on **both** the initial run and every update run.
- The completion function is executed even when the run fails, with whatever the modules managed to register. A failed run isn't rolled back, matching how the navigation items already behave. Note that a module throwing doesn't fail the run: module errors are collected and returned rather than thrown.
- A plugin that doesn't declare the method is skipped.
- A faulty plugin is isolated, the same way a faulty module is. A throwing hook or a throwing completion function is logged, the remaining plugins are still notified, the modules still register, the runtime's scope is still completed, and the run still resolves.

## Caveats

On an update run, completion functions execute before Squide commits the navigation items of that run, so a completion function must not read `getNavigationItems()` — it would still return the items of the previous run. A completion function should only commit the plugin's own state.

A plugin error reaches the runtime logger only. It doesn't surface through the `onError` callback of `useDeferredRegistrations`, which reports module registration errors. And because a throwing hook leaves that plugin's registry in whatever state it reached, it usually means the previous run's entries are still there — the very thing this hook exists to prevent, for that one plugin. Treat it as a bug to fix, not as a way to skip a run.
