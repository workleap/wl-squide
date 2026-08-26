# ADR-0023: `$priority` is refused, not ignored, on a nested navigation item

## Status

accepted

## Context

`$priority` is declared on `RootNavigationItem` only. `useRenderedNavigationItems` sorts the array it is handed and then calls `renderItems`, which recurses into a section's `children` without sorting. So `$priority` orders a menu's **top-level** items and nothing else. A test comment recorded that scoping; nothing else did.

`registerNavigationItem(item: RootNavigationItem, { sectionId })` accepted a `$priority` and a `sectionId` together, type checked with zero casts, and dropped the priority. This is the cross-module case — one module registering into another module's section — which is exactly where a developer reaches for a priority.

Two related shapes behaved differently, which made the whole thing hard to reason about:

- `children: [{ …, $priority: 10 }]` — already a `TS2353` excess-property error, because `NavigationItem` does not declare `$priority`.
- `const child: RootNavigationItem = { …, $priority: 10 }` then `children: [child]` — compiles, priority ignored.

The documentation compounded it by promising `$priority` worked at any depth, in four places. That half was corrected separately (see the `$priority` scoping change); this record is about the API.

## Options Considered

1. **Leave it** — `$priority` stays accepted and ignored alongside `sectionId`. Zero churn. Keeps a call that type checks, reads as meaningful, and does nothing, which is the shape of a bug rather than of an API.

2. **Warn at runtime** — log when both are provided. Discoverable only once the code runs, in a console people already scroll past, and it costs a runtime check on a hot registration path to report a mistake the compiler can see.

3. **Honour it — sort `children` too** — makes the docs' original promise true. Rejected on risk: it is the only option that can silently **reorder a live production menu** with no consumer opt-in. Any application that registered a nested `$priority` believing it worked would change appearance on upgrade, and the ones most affected are those that already tried. It also needs its own design decision about how priority interacts across modules contributing to one section.

4. **Refuse it in the type system** — split `registerNavigationItem` into two overloads; the `sectionId` one takes an item whose `$priority` is `never`. Compile-time only, zero runtime change, and the error arrives where the mistake is written.

## Decision

Option 4.

`NestedNavigationItem = NavigationItem & { $priority?: never }`, and `IReactRouterRuntime` declares two overloads:

```ts
registerNavigationItem(navigationItem: RootNavigationItem, options?: RegisterRootNavigationItemOptions): void;
registerNavigationItem(navigationItem: NestedNavigationItem, options: RegisterNestedNavigationItemOptions): void;
```

`RegisterRootNavigationItemOptions` narrows `sectionId` to `never`, so the two overloads are disjoint on the presence of `sectionId`.

Typing `$priority` as `never` rather than omitting it is what makes this reach the variable path. Omitting it, or typing the parameter as plain `NavigationItem`, only catches an object literal via the excess-property check: `RootNavigationItem` is an intersection and stays assignable to `NavigationItem`, so a variable slips through. With `$priority?: never` the property's type is `undefined`, and `number` is not assignable to it, so a variable typed `RootNavigationItem` is rejected as well. Verified by compiling both shapes.

Option 3 remains available and is not foreclosed. If ordering inside a section is ever wanted it is a feature with its own ADR, and it should be opt-in.

## Consequences

- The combination is a compile error (`TS2769`) instead of a silent no-op. **No runtime behaviour changes and no menu reorders.**
- Released as a **minor**: a consumer whose code passes both today gets a new compile error. The fix is deleting the `$priority`, which was having no effect.
- One path stays out of reach: a variable carrying a `$priority` placed directly into a `children` array. `useRenderedNavigationItems` takes whatever array it is given, so the types cannot cover it. It is documented rather than defended, and the docs and skill now say two of the three nesting paths are caught rather than one.
- `NestedNavigationItem`, `RegisterRootNavigationItemOptions` and `RegisterNestedNavigationItemOptions` are exported, since a consumer wrapping `registerNavigationItem` needs them to mirror the overloads.
- `ReactRouterRuntimeScope` needed no change: the deferred registration path types its runtime as `FireflyRuntime`, which extends `ReactRouterRuntime`, so the overloads already apply where a module actually calls the method.
- The documented `$priority` rules are now tests, at depths 0 through 3, including the depths that deliberately do **not** sort. Sorting `children` in future therefore requires editing an assertion that says it must not — the decision cannot be made by accident.
