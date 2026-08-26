---
order: 840
label: Migrate to firefly v19.0
toc:
    depth: 2-3
---

# Migrate to firefly v19.0

This major version rewrites how the navigation item registry stores what modules register. It builds the [navigation items](../essentials/register-nav-items.md) from the registrations instead of mutating a tree in place. Most applications have nothing to change.

## Breaking changes

- For a navigation **section**, `getNavigationItems` no longer returns the object that was registered.
- [Strict mode](../reference/routing/AppRouter.md#disable-strict-mode) reports a new situation, an **ignored declaration**.
- `NavigationItemRegistrationStatus` gained a `"deduplicated"` value.
- A section written as a class whose accessors read ECMAScript `#private` fields now breaks on every registration path, where it previously broke only from a deferred registration function. The `TypeError` surfaces when the accessor is read, at render.

## Optional changes

Two errors no longer exist, and the workarounds for them can be removed:

- `A nested navigation item must have the same registration type as the section it's nested under`. A section and the items nested under it can now be registered from different phases.
- `A navigation section index has already been registered for the menu`. Several modules can now declare the same section.

## Compare sections by `$id`

The registry builds each section from its registration, so nesting an item under a section never writes to the `children` array a module owns:

```ts
const section = { $id: "settings", $label: "Settings", children: [] };

runtime.registerNavigationItem(section);

runtime.getNavigationItems()[0] === section; // false, was true for a static registration
runtime.getNavigationItems()[0].$id === section.$id; // true
```

Compare by `$id` instead, which is what [useRenderedNavigationItems](../reference/routing/useRenderedNavigationItems.md) already does:

```ts !#3
const items = runtime.getNavigationItems();

const settings = items.find(x => x.$id === "settings");
```

Treat a returned section as read-only. It is the object the menu renders, so mutating it changes what every consumer sees. Do not mutate a section after registering it either: whether the change reaches the menu depends on whether the section has been projected yet.

A **link** is unaffected. It has no `children`, so nothing is ever attached to it and it is returned exactly as it was registered.

!!!warning
A section keeps its prototype and its accessor properties, so a lazy `$label` getter stays lazy.

An ECMAScript `#private` field is the exception. It is a slot rather than a property, so no copy can carry it and an accessor reading one throws. TypeScript's `private` keyword compiles to an ordinary property and is not affected.
!!!

Register a plain object built from the instance instead:

```ts !#3-7
const section = new SettingsSection();

runtime.registerNavigationItem({
    $id: section.$id,
    $label: section.$label,
    children: section.children
});
```

## Register a section and its items from different phases

Registering a nested item whose section was registered in a different phase used to throw. It now works, and each deferred registration update removes and re-adds the deferred items correctly:

```ts !#3,11
// Registered once, during the static registration phase.
export const register: ModuleRegisterFunction<FireflyRuntime, unknown, FeatureFlags> = runtime => {
    runtime.registerNavigationItem({ $id: "reports", $label: "Reports", children: [] });

    return (deferredRuntime, data) => {
        if (!data.isAdoptionReportEnabled) {
            return;
        }

        // Registered again on every update run, and removed by the next one.
        deferredRuntime.registerNavigationItem({
            $id: "adoption",
            $label: "Adoption",
            to: "/reports/adoption"
        }, {
            sectionId: "reports"
        });
    };
};
```

A static item nested under a section that a deferred run stops registering is parked as a pending registration rather than throwing. It is reported by the validation that runs after every completed update run.

## Declare a shared section in every module

Declaring a section whose `$id` is already registered for the menu used to throw. It is now an ensure: the first declaration registers the section, and the following ones find it already there. A section that several modules contribute to no longer needs an owning module:

```ts !#3-7
// In every contributing module.
export const register: ModuleRegisterFunction<FireflyRuntime> = runtime => {
    runtime.registerNavigationItem({
        $id: "settings",
        $label: "Settings",
        children: []
    });

    runtime.registerNavigationItem({
        $id: "billing-settings",
        $label: "Billing",
        to: "/settings/billing"
    }, {
        sectionId: "settings"
    });
};
```

A shared section can itself be nested. Declare it with the same `sectionId` option in every module and it is deduplicated the same way, even when the section holding it is not registered yet.

!!!warning
Declare a shared section **identically** in every module, and attach it with the `sectionId` option rather than writing it inline in another section's `children`.

The section's options come from whichever declaration ran first, and deferred registration functions run concurrently, so which module gets there first is not defined. Anything a later declaration adds is discarded and [reported](#fix-the-ignored-declarations).
!!!

### Remove the section guard

Applications that kept a `Set` of already-declared section ids to work around the throw can drop it. Keeping it is harmless, the guard is simply redundant.

Before:

```ts !#4,6,10-13
import { DeferredRegistrationsUpdateStartedEvent } from "@squide/firefly";

const register: ModuleRegisterFunction<FireflyRuntime, unknown, FeatureFlags> = runtime => {
    const registeredSections = new Set<string>();

    runtime.eventBus.addListener(DeferredRegistrationsUpdateStartedEvent, () => registeredSections.clear());

    return (deferredRuntime, data) => {
        data.enabledReports.forEach(x => {
            if (!registeredSections.has("reports")) {
                registeredSections.add("reports");
                deferredRuntime.registerNavigationItem({ $id: "reports", $label: "Reports", children: [] });
            }

            deferredRuntime.registerNavigationItem({ $id: x, $label: x, to: `/reports/${x}` }, { sectionId: "reports" });
        });
    };
};
```

After:

```ts !#4
const register: ModuleRegisterFunction<FireflyRuntime, unknown, FeatureFlags> = () => {
    return (deferredRuntime, data) => {
        data.enabledReports.forEach(x => {
            deferredRuntime.registerNavigationItem({ $id: "reports", $label: "Reports", children: [] });

            deferredRuntime.registerNavigationItem({ $id: x, $label: x, to: `/reports/${x}` }, { sectionId: "reports" });
        });
    };
};
```

!!!info
A navigation **link** is never deduplicated. Registering two links with the same `$id` renders two links, so a guard against registering the same link twice is still needed.
!!!

## Fix the ignored declarations

Strict mode throws in development and logs in production when a re-declaration of an already-registered section carried any of the following:

- Inline `children`.
- A `$canRender` the registered section doesn't have.
- A `$priority`, a `sectionId` or a string `$label` that differs from the registered section's.

The report names the menu, the section, and what each declaration would have contributed. `$meta` and `$additionalProps` are not compared, so a declaration differing only in those is discarded without a report. A section declared inside another section's `children` is reported as well, since it is dropped from where it was written together with everything declared under it.

If it fires when you upgrade, it is surfacing a misconfiguration that was previously silent or that the removed throws were masking.

## Handle the new registration status

`NavigationItemRegistrationStatus` gained a `"deduplicated"` value, reported for a declaration that found its section already registered. It is exported through `@squide/firefly`, so an application narrowing on it exhaustively gets a compile error.
