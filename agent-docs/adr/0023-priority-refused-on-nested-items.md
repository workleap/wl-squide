# ADR-0023: `$priority` is refused, not ignored, on a nested navigation item

## Status

proposed

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

The refusal conditions on `$priority` being **required** in the item's type, not on its being present:

```ts
export type RefuseNestedPriority<T> = T extends { $priority: number } ? never : T;
```

An object literal written with `$priority: 10` infers the property as required and resolves to `never`. A variable declared as `RootNavigationItem` has it optional and passes through.

`IReactRouterRuntime` declares three overloads, most specific first:

```ts
registerNavigationItem<T extends NavigationItem>(navigationItem: RefuseNestedPriority<T>, options: RegisterNestedNavigationItemOptions): void;
registerNavigationItem(navigationItem: RootNavigationItem, options?: RegisterRootNavigationItemOptions): void;
registerNavigationItem<T extends NavigationItem>(navigationItem: RefuseNestedPriority<T>, options: RegisterNavigationItemOptions): void;
```

**The first attempt at this was wrong, and the way it was wrong shaped the final design.** It typed the nested parameter as `NavigationItem & { $priority?: never }`, reasoning that `never` would catch a variable as well as a literal. It does — but it catches *every* variable declared as `RootNavigationItem`, because that type carries an optional `$priority` whether or not one was ever assigned: the property's type is `number | undefined`, which is not assignable to `undefined`. Four ordinary patterns stopped compiling: a nested registration from a variable, the same in a `forEach`, a conditional `sectionId`, and a wrapper forwarding an options bag. The repository's samples only pass object literals, so the whole suite and the typecheck stayed green.

That is also why the third overload exists. A `sectionId` is frequently neither definitely present nor definitely absent — `string | undefined` from a conditional or a forwarded options bag matches neither of the first two overloads, so without it that code stops compiling. It accepts the widened options and still refuses a definitely-present `$priority`, which is the strongest check available when the target is unknown.

Option 3 remains available and is not foreclosed. If ordering inside a section is ever wanted it is a feature with its own ADR, and it should be opt-in.

## Consequences

- The combination is a compile error (`TS2769`) instead of a silent no-op. **No runtime behaviour changes and no menu reorders.**
- Released as a **minor**: a consumer whose code passes both today gets a new compile error. The fix is deleting the `$priority`, which was having no effect.
- **Two paths stay out of reach, by design.** A variable carrying a `$priority` passed with a `sectionId` is accepted, because the type cannot distinguish it from a variable that has none, and rejecting it would reject every `RootNavigationItem` variable. So is a variable placed directly into a `children` array, since `useRenderedNavigationItems` takes whatever array it is handed. Both are documented rather than defended, and both are asserted in the type tests so they read as known limits rather than as surprises.
- `RefuseNestedPriority`, `RegisterRootNavigationItemOptions` and `RegisterNestedNavigationItemOptions` are exported, since a consumer wrapping `registerNavigationItem` needs them to mirror the overloads.
- The contract is pinned by `tests/registerNavigationItem.types.test.ts`, which asserts both halves: what must be refused, via `@ts-expect-error`, and what must keep compiling. The second half is what the first attempt lacked. Neutralizing `RefuseNestedPriority` to a pass-through makes four of those directives unused, so the file fails the build rather than going quietly green.
- `ReactRouterRuntimeScope` needed no change: the deferred registration path types its runtime as `FireflyRuntime`, which extends `ReactRouterRuntime`, so the overloads already apply where a module actually calls the method.
- The documented `$priority` rules are now tests, at depths 0 through 3, including the depths that deliberately do **not** sort. Sorting `children` in future therefore requires editing an assertion that says it must not — the decision cannot be made by accident.
