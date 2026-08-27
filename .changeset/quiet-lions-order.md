---
"@squide/react-router": minor
"@squide/firefly": minor
---

`$priority` now orders navigation items at every depth, not only a menu's top-level items.

**This changes rendered output.** A section's items were previously rendered in the order they appeared in its `children` array, whatever their `$priority`. They are now sorted the same way a menu's top-level items are.

## Why

`$priority` exists to resolve order at a composition point — somewhere items arrive from independent modules that cannot see each other, so no author controls the array. The top level was the only such place when the prop was designed, which is why sorting stopped there.

The `sectionId` option changed that: a module can nest an item into another module's section, so `children` is a composition point too. Modules register concurrently (`Promise.allSettled`) and deferred registrations run after data fetching, so those items are appended in whatever order their registrations complete — a function of network and data timing, not authorship. Until now there was no lever for it. Array order was nobody's to set, and `$priority` was not consulted.

## What to expect

- An item with **no `$priority`** below the root is unaffected. The comparator returns `0` for equal priorities and the sort is stable, so a section whose items have no priorities, or all the same one, keeps its declaration order exactly.
- An item **with** an explicit `$priority` below the root now moves. Reaching that state previously required either the `sectionId` option or widening a variable into `children`, both of which mean a priority was written down and silently ignored — so this should be the order that was being asked for.
- Negative priorities work at depth as they do at the root: a missing priority defaults to `0`, so `$priority: -10` places an item behind its unprioritized siblings.

If you need an order that contradicts `$priority`, note that pre-sorting the items before handing them to `useRenderedNavigationItems` does not achieve it: the hook sorts every array it receives, so a caller's order is discarded and only ties survive. Strip `$priority` from the tree you pass in, or render the menu without this hook.

The sort moved into the `renderItems` recursion, and each array is copied before sorting — a section's `children` is the registry's own array, handed over by reference, so sorting in place would have reordered the registry itself.

