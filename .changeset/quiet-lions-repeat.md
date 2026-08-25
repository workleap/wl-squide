---
"@squide/react-router": major
"@squide/firefly": major
---

The navigation item registry now stores the registrations and builds the navigation items from them, instead of storing a navigation item tree it partially mutated.

A nested navigation item used to be attached by pushing it into its parent section's `children` array. Nothing in that array recorded which registration put it there, or whether that registration was static or deferred, so `clearDeferredItems` could only ever work at the top level of a menu. Everything below is a consequence of that limitation, and each of them was reachable in an application.

**A navigation section and the items nested under it can now be registered from different phases.** Registering a nested item whose section was registered in a different phase used to throw `A nested navigation item must have the same registration type as the section it's nested under`. The throw existed because a deferred item pushed into a static section survived every update run and accumulated. That is now undone correctly at any depth, and the throw is gone.

**A static item nested under a deferred section is no longer lost.** It went back to being a pending registration only in name: the section was removed by the update run and the item disappeared with it, silently. It is now genuinely parked as pending and is reported by the validation that runs after every completed update.

**A navigation section returned by `getNavigationItems` is no longer the object that was registered.** Sections are built from the registrations, on both the static and the deferred paths, which is the breaking part of this release:

```ts
const section = { $id: "settings", $label: "Settings", children: [] };

runtime.registerNavigationItem(section);

runtime.getNavigationItems()[0] === section; // false, was true for a static section
```

Compare sections by `$id`, which is what the framework's own renderers do. Links are unaffected — a link has no `children`, so nothing is ever attached to it and it is returned exactly as it was registered. Mutating a section after registering it never changed what the menu renders on the deferred path, and now it doesn't on the static path either.

The prototype chain and accessor properties of a registered section are preserved, so a section backed by a class instance or carrying a lazy `$label` getter still behaves. The one exception is an ECMAScript `#private` field: it is a slot rather than a property, so no copy can carry it, and an accessor reading one throws. That was already the case for a deferred registration in the previous release, and it now applies to a static registration as well. Register a plain object built from the instance instead.

See the [v19.0 migration guide](https://workleap.github.io/wl-squide/updating/migrate-to-firefly-v19.0/) for the full upgrade path.

Registration is roughly 2.5–3.5× slower and reads are at parity — single-digit milliseconds once at bootstrap for an application registering a thousand navigation items, and about a millisecond per deferred registration update. In exchange, a menu branch that did not change keeps its object identity across a registration, where the whole array used to be replaced.
