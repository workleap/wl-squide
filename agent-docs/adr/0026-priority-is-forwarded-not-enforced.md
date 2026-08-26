# ADR-0026: `$priority` is forwarded to the renderer, not enforced by Squide

## Status

proposed

## Context

`$priority` orders navigation items, higher first. `useRenderedNavigationItems` sorts the array it is handed and then recurses into each section's `children` without sorting them.

That asymmetry was never written down, so it kept being read as a bug. Three separate attempts in short succession tried to "finish" or "scope" the prop:

- Documentation was corrected to say sorting "only applies to the top-level items of a menu" and that a nested item's `$priority` "is ignored" (#681).
- A PR type-refused `$priority` on any item registered with a `sectionId`, then on any item whose `$priority` is definitely present (#685).
- An earlier bundle, since reverted, touched the same area (#671).

None of them asked why the value was on nested items in the first place. It is there so the code rendering the menu can read it. Squide does not own how a section is laid out — a consumer may render a section as a sorted list, as a fixed-order set of tabs, or grouped by something in `$meta`. Sorting the top level is Squide's minimum useful default because the top level is assembled from independent modules that cannot see each other's registration order. Inside a section, the module that declared the section already controls the order of its `children`, so imposing a sort there would silently reorder existing production menus with no consumer opt-in.

The forwarding half broke and stayed broken long enough to be mistaken for the design. `toLinkProps` originally spread a link's remaining props into `linkProps` untouched, so `$priority` arrived at the renderer as `linkProps.$priority`. #665 added `stripMetadataProps` to keep `$` prefixed props off the DOM element, which is correct on its own terms, and `$priority` went out with the rest. `toMenuProps` never forwarded it at all. With no way to read the value, a nested `$priority` really did do nothing, which is what the docs then described.

## Options Considered

1. **Sort `children` too.** Makes `$priority` mean one thing at every depth. Rejected: it changes the rendered order of every existing menu that has both nested items and any `$priority`, with no way for a consumer to decline, and it takes layout decisions away from the code that renders the menu.
2. **Scope the prop to the root and refuse it below.** What #685 attempted. Rejected: it deletes a capability rather than fixing a defect, and it is not expressible in the type system without collateral damage — refusing the property rejects every variable typed as a navigation item, because such a variable carries an optional `$priority` whether or not one was set. The implementation that made it to review broke four ordinary call patterns and passed CI, because the samples only ever pass object literals.
3. **Forward it and let the renderer decide.** Squide sorts the top level and hands every item's `$priority` to `renderItem` as `priority`, at every depth. The renderer sorts a section if it wants to.

## Decision

Option 3.

`$priority` is declared on `NavigationLink` and `NavigationSection`, so it is legal at any depth. `RootNavigationItem` becomes an alias of `NavigationItem`; it stays in the API because the many signatures naming it read as "the root of a menu", which is still the useful distinction, but it no longer carries the property.

`NavigationLinkRenderProps` and `NavigationSectionRenderProps` carry a `priority?: number`, forwarded exactly as declared. `undefined` is passed through rather than defaulted to `0`, so a renderer can tell "nobody set a priority" from "somebody set `0`" — the two are different inputs to a grouping or badging decision, and there is no safe identity value for a number the way `{}` is for `additionalProps` and `meta`. Squide's own top-level comparator keeps its `?? 0` default, which is what the public docs have always promised.

The division of labour: **Squide sorts a menu's top-level items. Everything else about order is the renderer's, and Squide's job is to make sure the renderer has the data.**

## Consequences

- A consumer can order a section's items again, by sorting the tree from `useNavigationItems` before handing it to `useRenderedNavigationItems`. Neither render callback can do it: `renderItem` is `(item, key, index, level)` and sees one item at a time, and `renderSection` receives elements that are already rendered. What `priority` on the render props buys is everything short of reordering — grouping, badging, a `data-` attribute driving a CSS `order` — plus the ability to write the pre-sort against the same value the renderer sees.
- `$priority` inside a `children` literal now compiles. It used to be a `TS2353` excess-property error, even though the registry has always carried a nested item's `$priority` through verbatim, so the error was protecting nothing.
- The documentation claim that a nested `$priority` "is ignored" is withdrawn. It described the regression.
- No rendered order changes. The hook sorts the array it receives and recurses in declaration order, exactly as before.
- A future change that starts sorting `children` has to supersede this record and account for reordering live menus. The tests in `useRenderedNavigationItems.test.tsx` that assert declaration order inside a section exist to force that conversation rather than allow the change to slip in.
- `stripMetadataProps` keeps stripping `$priority` from `linkProps`. Forwarding is a named render prop, never a passthrough, so nothing `$` prefixed reaches the DOM element.
