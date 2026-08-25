---
"@squide/react-router": major
"@squide/firefly": major
---

Several modules can now declare the same navigation section. Declaring a section that is already registered for a menu is an ensure rather than an error.

Registering a section whose `$id` was already registered for the menu used to throw `A navigation section index has already been registered for the menu`. A section that several modules contribute to has no owner, so either one module was arbitrarily nominated to own it, or every module declared it and the second one to run crashed. The documented workaround was a `Set` of already-declared section ids, cleared on `DeferredRegistrationsUpdateStartedEvent`.

A section `$id` now identifies a container within a menu. The first declaration registers it, the following ones find it already there and contribute nothing:

```ts
// In the billing module.
runtime.registerNavigationItem({ $id: "settings", $label: "Settings", children: [] });
runtime.registerNavigationItem({ $id: "billing", $label: "Billing", to: "/settings/billing" }, { sectionId: "settings" });

// In the notifications module. The same section, declared identically.
runtime.registerNavigationItem({ $id: "settings", $label: "Settings", children: [] });
runtime.registerNavigationItem({ $id: "notifications", $label: "Notifications", to: "/settings/notifications" }, { sectionId: "settings" });
```

A single `Settings` section is rendered, holding both links, whichever order the modules register in.

**Declare a shared section identically in every module, and attach the items with the `sectionId` option.** The section's `$label`, `$priority`, `$meta` and every other option come from whichever declaration ran first, and deferred registration functions run concurrently, so which module gets there first is not defined. This was already true of which module got the throw.

**A declaration that would have contributed something is reported.** Inline `children`, a `$priority`, or a `sectionId` on a re-declaration are discarded, so `_validateRegistrations` now names the menu, the section and what each ignored declaration carried. A re-declaration carrying none of those options is the supported shape and is never reported.

A second situation is reported alongside it: a section that was waiting for its own section, and found its `$id` already taken by the time that section was registered. It is rendered where it was registered, but items nested with that `$id` reach the other section, so it is always reported whatever it carries.

Both throw in development and are logged in production, like the rest of the validation, and `strictMode={false}` on `AppRouter` turns them off.

**The `Set` workaround is obsolete.** Keeping it is harmless — the guard is simply redundant — so removing it is a cleanup rather than a migration.

`NavigationItemRegistrationStatus` gained a `"deduplicated"` value, reported by `registerNavigationItem` for the declarations that found their section already registered.

See the [v19.0 migration guide](https://workleap.github.io/wl-squide/updating/migrate-to-firefly-v19.0/) for the full upgrade path.

Applications that were relying on the throw to catch a genuine `$id` collision lose the eager failure. The validation still catches it whenever the colliding sections carry children or a `$priority`, which a real section does. Two empty, unprioritized sections colliding renders as one section with one of the two labels, and no rule can separate that input from the supported shared-section pattern. A section `$id` is a name in a namespace every module shares — pick one specific enough not to collide by accident.
