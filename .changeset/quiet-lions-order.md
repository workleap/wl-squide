---
"@squide/react-router": major
"@squide/firefly": major
---

`$priority` now orders navigation items at every depth, not only a menu's top-level items.

**This is a breaking change.** A section's items were previously rendered in the order they appeared in its `children` array, whatever their `$priority`, and that was the documented contract: *"An item nested inside a section renders in the order it appears in that section's `children` array, and its `$priority` is ignored."* They are now sorted the same way a menu's top-level items are.

## Are you affected

Only if an item at depth 1 or deeper carries an explicit `$priority`. If no nested item has one, nothing changes: the comparator returns `0` for equal priorities and the sort is stable, so a section keeps its declaration order exactly.

Reaching that state required one of:

- the `sectionId` option, `registerNavigationItem({ …, $priority }, { sectionId })`
- assigning a variable that carries a `$priority` into a `children` array
- writing `$priority` directly in a `children` literal, which only became legal in `@squide/react-router@9.6.0`

In all three cases the priority was previously accepted and ignored, so the new order is most likely the one that was being asked for. Check any menu where the three above apply before upgrading.

## Why

`$priority` exists to resolve order at a composition point — somewhere items arrive from independent modules that cannot see each other, so no single author controls the array. The top level was the only such place when the prop was designed, which is why sorting stopped there.

The `sectionId` option changed that. A module can nest an item into another module's section, so `children` became a composition point too. Modules register concurrently (`Promise.allSettled`) and deferred registrations run after data fetching, so those items are appended in whatever order their registrations complete — a function of network and data timing rather than authorship. There was no lever for it: array order was nobody's to set, and `$priority` was not consulted.

## Migration

Nothing to do unless you have a nested `$priority` and want the old order.

Set the priorities you want, at any depth. A missing priority defaults to `0`, so `$priority: -10` places an item behind its unprioritized siblings, and equal priorities keep declaration order.

To keep a section in declaration order regardless, remove `$priority` from the items in it. Pre-sorting the tree and handing it to `useRenderedNavigationItems` does **not** work — the hook sorts every array it receives, including the one you pass in, so your order is discarded and only ties survive:

```tsx
// Does nothing. The hook re-sorts by $priority.
const sorted = sortHowever(useNavigationItems());
useRenderedNavigationItems(sorted, renderItem, renderSection);
```

If you need an order that contradicts `$priority`, strip the property from the tree you pass in, or render the menu without this hook.

## Also in this release

`priority` on the render props is unchanged and still forwarded exactly as declared, `undefined` included, for what ordering does not cover: grouping, badging, or a comparator of your own. If you write one, default a missing priority — `(y.priority ?? 0) - (x.priority ?? 0)`.

Internally the sort moved into the `renderItems` recursion, and each array is copied before sorting, since a section's `children` is the registry's own array handed over by reference.
