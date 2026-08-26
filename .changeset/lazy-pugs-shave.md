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

**A declaration that would have contributed something is reported.** Inline `children`, a `$canRender` the registered section doesn't have, or a `$priority`, a `sectionId` or a string `$label` that differs from the registered section's, are discarded on a re-declaration, so `_validateRegistrations` now names the menu, the section and what each ignored declaration carried. A section declared inside another section's `children` is reported too, since it is dropped from where it was written together with everything declared under it. A re-declaration registered at the root of the menu and carrying none of those is the supported shape and is never reported.

A section that was waiting for its own section is decided by the same rule once the section holding it registers. It is dropped rather than rendered beside the section that owns the identifier, and it is reported only if it lost something, so a shared section nested under another one is registered once whichever order the modules run in.

The report throws in development and is logged in production, like the rest of the validation, and `strictMode={false}` on `AppRouter` turns it off.

**The `Set` workaround is obsolete.** Keeping it is harmless — the guard is simply redundant — so removing it is a cleanup rather than a migration.

`NavigationItemRegistrationStatus` gained a `"deduplicated"` value, reported by `registerNavigationItem` for the declarations that found their section already registered.

See the [v19.0 migration guide](https://workleap.github.io/wl-squide/updating/migrate-to-firefly-v19.0/) for the full upgrade path.

Applications that were relying on the throw to catch a genuine `$id` collision lose the eager failure. The validation still catches it whenever the colliding sections carry children, an unmatched `$canRender`, a `$priority`, an inline position, or two string labels that differ, which a real section does. What stays silent is two sections that are empty, unprioritized, both declared at the root of a menu, and whose labels are not two strings that differ, which is the same input as the supported shared-section pattern. `$meta` and `$additionalProps` come from the first declaration and are never compared. A section `$id` is a name in a namespace every module shares — pick one specific enough not to collide by accident.
