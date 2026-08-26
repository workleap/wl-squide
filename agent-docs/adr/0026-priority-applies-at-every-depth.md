# ADR-0026: `$priority` orders items at every depth, and is forwarded to the renderer

## Status

proposed

## Context

`$priority` orders navigation items, higher first. Until now it did so only for a menu's top-level items, and the property was consumed and then thrown away.

That was deliberate, not an oversight. The first version of the package (May 2023) sorted the array it received and then stripped the property before recursing:

```ts
const sortedItems = [...navigationItems]
    .sort(/* by priority */)
    // priority is intentionally omitted.
    .map(({ priority, ...itemProps }) => ({ ...itemProps }));
```

The scoping was expressed three ways at once: `priority` was declared on `RootNavigationItem` only, so `children: NavigationItem[]` had no such field; the strip removed it from the root items too, so the recursion could not have sorted even if it wanted to; and the comment said so outright. That strip survived two years and every refactor, until the `$meta` channel replaced it with `stripMetadataProps`.

The rationale holds up for the world it was written in. A section's `children` were always a single array literal, authored by one person in one place, so the order was already fully under that author's control and a priority would have resolved nothing. The root array is the opposite: it is assembled from independent modules that cannot see each other, and a numeric priority is the only way to get a deterministic order across them. `$priority` solved a problem that existed only at the composition boundary, and the root was the only composition boundary.

**The `sectionId` option removed that invariant.** Introduced with nested navigation items, it lets a module nest an item into *another module's* section, which makes `children` a cross-module composition point — the exact situation `$priority` exists for at the root. That change did not revisit the sort, and the two facts have coexisted since without being reconciled.

The consequence is a case with no lever at all. Modules register concurrently — `Promise.allSettled(registrationFunctions.map(async …))` in both `LocalModuleRegistry` and `RemoteModuleRegistry` — and deferred registrations run after data fetching, so registration order is a function of network and data timing rather than authorship. Two modules nesting into a shared section get an order their authors cannot control, and neither of the two things that could have helped was available: `$priority` was not honored at that depth, and it was not visible to the code rendering the menu either.

The scoping was also mis-recorded along the way. Documentation was corrected to state that a nested `$priority` "is ignored" (#681), and a PR type-refused the property on nested items altogether (#685). Both described the implementation accurately and mistook it for the design.

## Options Considered

1. **Keep the root-only scope and refuse the property below it.** What #685 attempted. Rejected: it removes the only remaining way to express intent at a composition point that now exists, and it is not expressible in the type system without collateral damage — refusing the property rejects every variable typed as a navigation item, since such a variable carries an optional `$priority` whether or not one was set. The implementation that reached review broke four ordinary call patterns and passed CI, because the samples only pass object literals.
2. **Forward `$priority` to the renderer and let it sort.** Squide sorts the top level; the renderer sorts a section if it wants to. Rejected as the whole answer: it leaves every consumer re-implementing the same comparator to get an order the framework already knows how to produce, and it makes correct behavior opt-in for a problem the framework created by registering modules concurrently.
3. **Sort at every depth, and forward the value as well.** `$priority` means one thing wherever it appears, and the renderer still receives it for the things sorting does not cover.

## Decision

Option 3.

`$priority` is declared on `NavigationLink` and `NavigationSection`, so it is legal at any depth. `RootNavigationItem` becomes an alias of `NavigationItem`; it stays in the API because the many signatures naming it read as "the root of a menu", which is still the useful distinction, but it no longer carries the property.

`useRenderedNavigationItems` sorts by `$priority` at every level, not only the array it is handed. Ties keep declaration order, which the existing comparator already guarantees by returning `0` for equal priorities and relying on a stable sort.

`NavigationLinkRenderProps` and `NavigationSectionRenderProps` also carry a `priority?: number`, forwarded exactly as declared. `undefined` is passed through rather than defaulted to `0`, so a renderer can tell "nobody set a priority" from "somebody set `0`" — different inputs to a grouping or badging decision, and there is no safe identity value for a number the way `{}` is for `additionalProps` and `meta`. The sort keeps its own `?? 0` default, which is what the public docs have always promised.

Forwarding is not made redundant by sorting. The value drives things ordering does not: grouping, badging, a `data-` attribute for a CSS `order`, or a renderer that wants a different comparator than the framework's.

**The two halves ship separately.** Forwarding is additive and goes first. Sorting `children` changes rendered output and follows on its own, so a behavior change is not bundled with an additive one.

## Consequences

- A section assembled from several modules through `sectionId` can be ordered deterministically for the first time. That is the case this exists for; it had no answer before.
- Rendered output changes for one specific shape: an item at depth ≥ 1 carrying an explicit `$priority`. Before this change that required either the `sectionId` option or widening a variable into `children`, both of which mean someone wrote a priority down and silently did not get one. An item with no `$priority` below the root is unaffected, since the comparator is a no-op across equal values. The blast radius is small and points at people who asked for the behavior.
- `$priority` inside a `children` literal now compiles. It used to be a `TS2353` error even though the registry carried a nested item's `$priority` through verbatim, so the error was protecting nothing.
- The documentation claim that a nested `$priority` "is ignored" is withdrawn, along with the claim that it is scoped to the root by design.
- `stripMetadataProps` keeps stripping `$priority` from `linkProps`. Forwarding is a named render prop, never a passthrough, so nothing `$` prefixed reaches the DOM element.
- The framework now decides an order that a consumer previously controlled by array order alone. A renderer that wants declaration order back has to sort the tree itself before handing it over, which is the same escape hatch that made the forward-only option workable.
