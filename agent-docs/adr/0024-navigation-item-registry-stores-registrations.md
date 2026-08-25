# ADR-0024: The Navigation Item Registry Stores Registrations and Projects the Tree

## Status

proposed

This record and [ADR-0025](./0025-declaring-a-navigation-section-twice-is-an-ensure.md) cover one change and ship in the same major. This one is the storage model, ADR-0025 is the consumer-facing section semantics that follow from it. Neither has been accepted yet, and neither has [ADR-0022](./0022-deferred-registration-update-reporting.md), which both build on.

## Context

`NavigationItemRegistry` stored a partially mutated navigation item tree. A root item went into `#menusIndex` as a `RegistryItem` carrying its `menuId` and its `registrationType`, but a nested item was attached by pushing it into its parent's `children`:

```ts
parentSection.item.children = [...(parentSection.item.children ?? []), item];
```

`children` is a plain `NavigationItem[]`. Nothing in it records which registration put an entry there, or whether that registration was static or deferred. `clearDeferredItems` could therefore only work at the top level of `#menusIndex`: it filtered the root arrays by registration type and left every nested item exactly where it was.

Four problems follow from that one limitation, and they read as unrelated until it is named.

**The registration-type throw had to exist.** `#addNestedItem` threw *"A nested navigation item must have the same registration type as the section it's nested under"*. Without it, a deferred child pushed into a static section survived every clear and the next run pushed another one beside it. The throw is not a rule about how modules ought to be written, it is a guard around a clear that cannot reach.

It also fires where no module author can act on it. A deferred registration update replays every buffered registration through `add`, so a static item that was pending on a section some other module registers from a deferred function throws during that replay, naming neither module. Issue [#658](https://github.com/workleap/wl-squide/issues/658) hit this pair, and [#671](https://github.com/workleap/wl-squide/pull/671) added a regression test pinning the throw.

**The duplicate section `$id` throw had the same origin.** Re-declaring a section on an update run would have re-attached items to a container the clear had not emptied, so `#addSectionIndex` threw instead. That throw is what forced consumers to keep a `Set` of already-declared section ids and clear it on `DeferredRegistrationsUpdateStartedEvent`.

**[ADR-0023](./0023-navigation-item-registry-owns-its-items.md)'s copy had to be invented**, because the line above mutates an object the registering module still owns.

**A section index entry could be orphaned** by a registration that threw partway through, leaving `#sectionsIndex` pointing at a section no menu held.

Each of those is a property of storing the result of the registrations rather than the registrations.

## Options Considered

1. **Keep the tree and fix each symptom in place.** What [ADR-0022](./0022-deferred-registration-update-reporting.md) and the four defects listed in #658 did, and it worked for what it covered. But every fix needs its own guard, the guards are what consumers then have to code around, and the accumulation bug behind ADR-0023 was found *after* those four were fixed and reproduced identically with all of them applied.
2. **Record each nested item's registration type beside it.** Either on the item, or in a `WeakMap` keyed on it so that nothing a module owns is written to. A clear could then find deferred children at any depth. On the item, it writes framework bookkeeping onto an object a module owns, which is what ADR-0023 exists to stop. In a `WeakMap`, it cannot tell two registrations of the same object apart — which is precisely the case ADR-0023 was written for, a module hoisting its section to module scope and registering it on every run.
3. **A tree of records.** Keep the parent/child shape, but make every node a record wrapping the item rather than the item itself. That removes the mutation and lets a clear work at any depth, without a flat list and the indexes derived from it. It loses on the clear: an item registered with a `sectionId` has to go back to *waiting* when its section is gone, so a node needs to remember both where it currently sits and where it was declared. A tree can encode one parent, not two, so the second link has to exist anyway — at which point the tree is a less inspectable encoding of a list of records.
4. **Store flat registration records and project the tree on read.** The registry keeps what was registered and derives what consumers see.

## Decision

**Option 4.**

```ts
interface RegistrationItem {
    id: number;
    // The registration this one is nested under, once its section is registered. "undefined" together with a
    // "sectionId" is what "pending" reports.
    parentId?: number;
    // The section this item was declared in, when it was declared inline rather than with the "sectionId"
    // option. Unlike "parentId" this never changes, which is what lets a clear rebuild the registry.
    inlineParentId?: number;
    menuId: string;
    registrationType: NavigationItemRegistrationType;
    sectionId?: string;
    item: NavigationItem;
}
```

`clearDeferredItems` becomes a filter on `registrationType` followed by a rebuild, correct at every depth.

**Inline children are decomposed into records too.** `registerNavigationItem({ $id: "settings", children: [link] })` and `registerNavigationItem(link, { sectionId: "settings" })` produce the same shape, so the two ways of nesting stop behaving differently.

**The two parent fields are not redundant.** `inlineParentId` is intrinsic — it is where the item was written, and it never changes. `parentId` is resolved, and a clear resets it to `inlineParentId`. That is what sends an item registered with `{ sectionId }` back to waiting when the run being cleared is what had registered its section, rather than leaving it attached to a section that no longer exists.

**`getItems` builds the tree.** `resolveNavigationSection` produces the section a consumer sees, from the registered object plus the children the records say it holds. It keeps ADR-0023's descriptor-copy technique unchanged, for the reasons ADR-0023 measured: `Object.create` with `getOwnPropertyDescriptors` preserves the prototype chain and keeps a `$label` getter lazy, and replacing the `children` descriptor rather than assigning to the finished copy is what makes a frozen section, or one exposing `children` through a getter, work.

**Both eager throws go.** Mixing registration types is now undone correctly by the clear, so the registration-type guard has nothing left to protect and is removed rather than kept as a style rule. Keeping it was a real option and it was rejected: it would forbid a shape that now works, on the strength of a comment that no longer describes anything, and the message it prints asks the author to fix an arrangement that is no longer a mistake. A section declared twice becomes an ensure, which is a consumer-facing decision of its own and is recorded in [ADR-0025](./0025-declaring-a-navigation-section-twice-is-an-ensure.md).

**This supersedes ADR-0023.** ADR-0023 decided that the registry copies a *deferred* navigation item as it stores it, and deliberately did not copy on the static path, so that `getItems()[0] === registeredObject` kept holding for a static section. That asymmetry existed because the registry mutated what it stored, and the static path could not accumulate. Projection removes the mutation on both paths and with it the reason for the asymmetry, so sections are now built uniformly and `getNavigationItems()[0]` is no longer reference-equal to the object a module registered for a static section. Links are still the caller's object, since a link has no `children` and nothing is ever attached to it. What ADR-0023 established survives — the registry never mutates a registering module's object — and what is reversed is the narrowing and the identity guarantee it bought. It is superseded rather than amended because its Decision is specifically about *when to copy*, and the answer is now "never, nothing is stored that needs copying".

Five invariants are load-bearing, and breaking any of them is silent. Each has a regression test.

**A section is indexed only once it is reachable from a menu root.** A section waiting for a section that was never registered holds nothing any menu shows. Indexing it lets it claim an `$id` it does not own, and a later real declaration of that section is then deduplicated against a container nothing holds, so the section disappears from the menu.

**Reachability is threaded down the inline children, never derived from `parentId`.** An inline child always has a parent, including when that parent is itself waiting, so `parentId !== undefined` is not a reachability test. Deriving it that way lets an inline child of a waiting section take pending items, which builds a cycle, and a single `registerNavigationItem` call then overflows the stack.

**A declaration is only a duplicate once it would take its place in a menu.** Checking before the parent is resolved swallows the report that the section it is waiting for is missing.

**Inline children are registered before a section takes its pending items**, so an inline child comes first in `children`, and a section reports its own completions before its children's in `completedPendingRegistrations`.

**The duplicated declarations are deleted on both sides of the early return in `clearDeferredItems`.** A declaration that lost outright creates no record, so a run that declared nothing but duplicates never reaches the rebuild, and the deferred ones are deleted before the early return. A declaration that kept its place is recorded while its section is being indexed, and the rebuild indexes every section it reaches again, so those are deleted after it. Deleting them earlier would lose them on the path where nothing is rebuilt.

Registration is roughly 2.5–3.5× slower than the previous implementation and reads are at parity, measured locally against a synthetic registration workload; the harness is not committed. In absolute terms that is single-digit milliseconds once at bootstrap for an application registering a thousand navigation items, and about a millisecond per deferred registration update.

The dominant cost is not the projection. `registerNavigationItem` reads `getItems(menuId)` back after every registration in order to log "All registered items", which turns an O(1) projection into a full tree rebuild N times. A pending-registration index keyed on the section being waited for, and a per-record projection cache discarded only along the ancestor chain of the registration that changed, bring the cost to the figures above. That cache also means a branch that did not change keeps its object identity across a registration, where the previous memoization replaced the whole array — a renderer memoizing on a section can hit, where before it was guaranteed to miss.

Evidence: `packages/react-router/src/NavigationItemRegistry.ts`. Migration guide: `docs/updating/migrate-to-firefly-v19.0.md`.

## Consequences

- A navigation section and the items nested under it can be registered from different phases. A module can register a section statically and nest deferred items under it, or the reverse, and each update run removes and re-adds the deferred ones correctly. This used to throw, including from an unrelated module's replay.
- `getNavigationItems()` no longer returns the object a module registered, for a section. An application comparing by reference, or reading a property it set on the section after registering it, is affected. Comparing by `$id` is unaffected, and that is what the framework's own renderers do.
- ADR-0023's ECMAScript `#private` field limitation now applies to static sections as well. A section written as a class whose accessor reads a private slot threw only from a deferred registration under `@squide/react-router` 9.3.0, and now throws on every path. A private field is a slot rather than a property, so no copy built from a descriptor bag can carry it. Register a plain object built from the instance.
- A static item nested under a deferred section is parked as pending when that section is not re-registered, and is reported by the validation that runs after every completed update run, per ADR-0022. It used to throw.
- Orphaned section index entries cannot occur. The index is derived from the records, so there is nothing left behind by a registration that fails partway.
- ADR-0023's copy is gone, and with it its allocation per deferred section per run. `NavigationItemDeferredRegistrationTransactionalScope.addItem` returning the uncopied original as `result.item` — a rough edge ADR-0023 noted — stops being a discrepancy, since nothing is copied anymore.
- The two registries still have different ownership semantics. `RouteRegistry` performs the identical `parentRoute.children = [...]` mutation and is not rewritten, because routes are frozen after phase 1 ([ADR-0001](./0001-two-phase-registration.md)) and cannot accumulate the same way. The asymmetry ADR-0023 noted is unchanged, and this design is the shape to apply if it ever needs fixing.
- Registration cost stays coupled to menu size through the "All registered items" logging, which runs even against a `NoopLogger`. Making it lazy would benefit the previous implementation equally and is left as separate work.
- The registry holds one record per navigation item rather than one entry per root item, so memory grows with the total number of registrations rather than with the number of menus.
