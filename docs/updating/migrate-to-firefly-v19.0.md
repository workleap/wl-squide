---
order: 840
label: Migrate to firefly v19.0
toc:
    depth: 2-3
---

# Migrate to firefly v19.0

This major version rewrites how the navigation item registry stores what modules register. It builds the navigation items from the registrations instead of keeping a navigation item tree that it partially mutated.

Most applications have nothing to change. Two behaviours are breaking, and two long-standing errors are gone.

## Breaking changes

- `getNavigationItems` no longer returns the object that was registered, for a navigation **section**.
- A navigation section written as a class whose accessors read ECMAScript `#private` fields now throws on every registration path, where it previously threw only from a deferred registration function.

## Removed errors

- `A nested navigation item must have the same registration type as the section it's nested under` no longer exists. A section and the items nested under it can now be registered from different phases.
- `A navigation section index has already been registered for the menu` no longer exists. Declaring a section that is already registered for a menu is now supported.

## A registered section is no longer the object you passed

The registry builds each section from its registration, so nesting an item under a section never writes to the `children` array a module owns:

```ts
const section = { $id: "settings", $label: "Settings", children: [] };

runtime.registerNavigationItem(section);

runtime.getNavigationItems()[0] === section; // false, was true for a static registration
runtime.getNavigationItems()[0].$id === section.$id; // true
```

Compare sections by `$id`, which is what [useRenderedNavigationItems](../reference/routing/useRenderedNavigationItems.md) already does:

```ts !#3
const items = runtime.getNavigationItems();

const settings = items.find(x => x.$id === "settings");
```

Mutating a section after registering it does not change what the menu renders. That was already the case for a deferred registration in `v18.4`; it now applies to a static registration as well.

**Links are unaffected.** A link has no `children`, so nothing is ever attached to it and it is returned exactly as it was registered.

The prototype chain and the accessor properties of a section are preserved, so a section backed by a class instance keeps its prototype and a lazy `$label` getter stays lazy. The exception is an ECMAScript `#private` field: it is a slot rather than a property, so no copy can carry it, and an accessor reading one throws. If you have such a section, register a plain object built from the instance:

```ts !#12-16
class SettingsSection {
    #label = "Settings";

    $id = "settings";
    children = [];

    get $label() {
        return this.#label;
    }
}

const section = new SettingsSection();

runtime.registerNavigationItem({
    $id: section.$id,
    $label: section.$label,
    children: section.children
});
```

TypeScript's `private` keyword compiles to an ordinary property and is not affected.

## A section and its items can be registered from different phases

Registering a nested item whose section was registered in a different phase used to throw. It now works, and each deferred registration update removes and re-adds the deferred items correctly:

```ts !#3,10
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

A static item nested under a section that a deferred run stops registering is now parked as a pending registration rather than throwing. It is reported by the validation that runs after every completed update run.

## A section can be declared by several modules

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

!!!warning
Declare a shared section **identically** in every module, and attach the items with the `sectionId` option rather than with `children`.

The section's `$label`, `$priority` and every other option come from whichever declaration ran first, and deferred registration functions run concurrently, so which module gets there first is not defined. A declaration carrying inline `children`, a `$priority`, or its own `sectionId` has those discarded, and is reported by [strict mode](../reference/routing/AppRouter.md#disable-strict-mode). Declare the section at the root of the menu rather than inside another section's `children`, and give every declaration the same `$label`.
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

## New strict mode reports

Strict mode reports two new situations. Both throw in development and are logged in production, and `strictMode={false}` on `AppRouter` turns them off with the rest of the validation.

**An ignored declaration.** A re-declaration of an already-registered section that carried inline `children`, a `$priority`, its own `sectionId`, or a `$label` that is a string and is not the registered one. Those are discarded, so the report names the menu, the section, and what each one would have contributed. A section declared inside another section's `children` is reported too, since it is dropped from where it was written together with everything declared under it.

**A declaration that does not own the identifier.** A section that was waiting for its own section, and found its `$id` already taken by the time it became reachable. It is rendered where it was registered, but items nested with that `$id` reach the other section. This is a genuine `$id` collision and is always reported.

If either fires when you upgrade, it is surfacing a misconfiguration that was previously silent or that the removed throws were masking.

## `NavigationItemRegistrationStatus`

The union gained a `"deduplicated"` value, reported for a declaration that found its section already registered. It is exported through `@squide/firefly`, so an application narrowing on it exhaustively gets a compile error.

## Performance

Registration is roughly 2.5–3.5× slower and reads are unchanged. In absolute terms that is single-digit milliseconds once at bootstrap for an application registering a thousand navigation items, and about a millisecond per deferred registration update.

A menu branch that did not change now keeps its object identity across a registration, where the whole array was previously replaced, so a renderer memoizing on a section can hit.
