# ADR-0023: The Navigation Item Registry Owns Its Copy of Deferred Items

## Status

proposed

## Context

`NavigationItemRegistry` attaches a nested navigation item to its parent section by mutating the section's `children` array:

```ts
parentSection.item.children = [...(parentSection.item.children ?? []), item];
```

`parentSection.item` is the object the registering module passed in. The registry holds it by reference, so this mutates state the module still owns.

During bootstrap that is harmless, because the static and deferred registration phases each run once. On a deferred registration *update* run it is not. Hoisting a navigation section to module scope is a natural pattern:

```ts
const settingsSection = { $id: "settings", $label: "Settings", children: [] };

export const register: ModuleRegisterFunction = runtime => {
    runtime.registerNavigationItem(settingsSection);
};
```

Every update run re-registers that same object and appends to the same array. The children accumulate: one item, then two, then three. Reproduced against `main`, a section holding a single link rendered three copies of it after two flag flips.

Issue [#658](https://github.com/workleap/wl-squide/issues/658) attributed the downstream bug that prompted it to "an app-side bug (a section registration cached across runs)". That reading does not hold up. Nothing in `docs/` states that navigation items must be freshly constructed on every run, and the framework is the party doing the mutating. Fixing the four registry defects the issue lists does **not** fix this — the accumulation reproduces identically with all of them applied.

## Options Considered

1. **Document the requirement instead.** Tell applications never to reuse a navigation item object across runs. Zero framework risk, but it makes a silent, cumulative corruption the application's fault for a rule the framework never stated, and nothing enforces or detects a violation.
2. **Freeze registered items.** `Object.freeze` on ingestion would make the mutation throw instead of corrupting. It converts silence into a loud failure, but the thing that throws is the framework's own `children` assignment, and it would break any consumer legitimately mutating its own item after registering it.
3. **Clone every item on ingestion.** Uniform and simple to reason about. Measured regressions on the static path, all silent: a section backed by a class instance lost its prototype, `instanceof` returned false, accessor properties were evaluated eagerly at registration time and frozen, and `getItems()[0] === registeredObject` stopped holding.
4. **Clone on the deferred path only, preserving property descriptors.** Narrow to the path that can actually accumulate, and copy descriptors rather than spreading so prototypes and lazy getters survive.

## Decision

**Option 4.**

```ts
function cloneNavigationItem<T extends NavigationItem>(item: T): T {
    if (isLinkItem(item)) {
        return item;
    }

    const descriptors = Object.getOwnPropertyDescriptors(item);

    descriptors.children = {
        value: item.children?.map(x => cloneNavigationItem(x)) ?? [],
        writable: true,
        enumerable: true,
        configurable: true
    };

    return Object.create(Object.getPrototypeOf(item), descriptors) as T;
}
```

The invariant this establishes: **the registry owns its copy of a deferred navigation item, and never mutates an object owned by a registering module.**

Three properties of that snippet are load-bearing and are easy to undo by accident.

**It is narrowed to `"deferred"`.** `#addNestedItem` enforces that a nested item has the same registration type as the section it is nested under, so a static section's children can only grow from static registrations, and the static phase runs exactly once per runtime. The static path cannot accumulate, so cloning it would be pure risk for no benefit — see the measured regressions under option 3.

**It copies property descriptors rather than spreading.** `{ ...item }` flattens the prototype chain and evaluates getters eagerly. `Object.create` with `getOwnPropertyDescriptors` keeps `instanceof` true and keeps a `$label` getter lazy, which matters because `$label` is a `ReactNode` and applications do compute it on access.

This does **not** extend to ECMAScript private fields. They are slots rather than properties, so `getOwnPropertyDescriptors` cannot see them and `Object.create` cannot install them: a section written as a class whose accessor reads a `#private` field throws `Cannot read private member` when the clone is rendered, where the original instance worked. TypeScript's `private` compiles to an ordinary property and is unaffected, as is a getter over public state. The limitation is accepted rather than worked around — a navigation item is a data shape (`$id`, `$label`, `to`, `children`), and no clone built from a descriptor bag can carry a private slot. An application that needs one should register a plain object built from the instance.

**It replaces the `children` descriptor rather than assigning to the finished clone.** Copying descriptors faithfully copies `writable: false` and accessor descriptors too, so assigning `clone.children` afterwards throws on a frozen section, and on a class exposing `children` through a getter. Building the new array into the descriptor bag sidesteps both. Getting this wrong would have been a regression rather than a limitation: before this change such a section only threw when something was actually nested under it, whereas an assignment on the clone throws for every deferred section, including leaves.

**It clones at the `add()` entry point, not deeper.** `add()` is the single funnel through which a caller-supplied item enters the registry. The two internal paths that attach items — `#tryRegisterPendingItems` and `#recursivelyRegisterSections` — bypass `add()` entirely and operate on objects that have already been through it, so a clone placed further in would leave those paths handling caller-owned objects. Cloning at the entry point also keeps the identity assertions that pin `getItems()[0]` to the registered object on the static path.

Links are returned as-is. A link has no `children`, so nothing mutates it, and cloning it would break identity for no gain.

`structuredClone` was considered and rejected: it throws on a `$label` holding a `ReactNode` and on the `$canRender` function. The helper above recurses through `children` on its own, which covers nested sections. That recursion, the prototype preservation and the frozen-section case each have a regression test, since all three are invisible in the flat case that the accumulation test covers.

Evidence: `packages/react-router/src/NavigationItemRegistry.ts` (`cloneNavigationItem` and its call site in `add`).

## Consequences

- A module can hoist a navigation section to module scope and register it on every deferred run without accumulating children. This is the fix for the originating downstream bug in #658, and none of the other fixes in that issue address it.
- On the deferred path, mutating your own navigation item after registering it no longer updates the live menu. This is an observable contract change, which is why it ships as a minor rather than a patch. A repository-wide sweep found zero occurrences of the pattern across `samples/`, `templates/` and `docs/` — all `registerNavigationItem` call sites pass freshly constructed literals.
- The two registries now have different ownership semantics for consumer-supplied objects. `RouteRegistry` performs the identical `parentRoute.children = [...]` mutation and is **not** cloned, because routes are frozen after phase 1 ([ADR-0001](./0001-two-phase-registration.md)) and a second registration throws, so the accumulation is not reachable the same way. The asymmetry is deliberate but is a rough edge.
- A clone costs one object allocation per deferred section per run, recursing through nested sections. Registration-time only, not per render.
- `NavigationItemDeferredRegistrationTransactionalScope.addItem` returns the uncloned original as `result.item`, so on the update path `result.item` is not reference-equal to the object the registry holds. This is logging-only today and is left as-is rather than adding a second clone.
- A navigation section written as a class whose accessors read ECMAScript `#private` fields throws when rendered from a deferred registration, where it previously worked. This is the one behaviour the clone cannot preserve, and it is a real, if narrow, regression rather than a limitation of the old code.
