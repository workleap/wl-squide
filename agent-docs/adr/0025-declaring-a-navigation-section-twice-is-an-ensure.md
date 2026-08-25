# ADR-0025: Declaring a Navigation Section Twice Is an Ensure

## Status

proposed

This record follows [ADR-0024](./0024-navigation-item-registry-stores-registrations.md) and ships in the same major. It is only reachable given ADR-0024's storage model, and it is the half that consumer code, the documentation and the skill are rewritten against.

## Context

`NavigationItemRegistry.#addSectionIndex` threw as soon as a section `$id` was already indexed for a menu: `[squide] A navigation section index has already been registered for the menu: "x" and section: "y". Did you register two navigation sections with similar "$id" option for the same menu?`

That made a navigation section something exactly one registration may create. It fits a section that one module owns. It does not fit the shape the framework otherwise encourages: a menu section that several modules contribute to — a `Settings` section holding one item from each of four feature modules — has no owner, so either one module is nominated to own it, which is the coupling [ADR-0003](./0003-event-bus-cross-module-communication.md) exists to avoid, or every module declares it and the second one to run throws.

Nothing wrote the rule down. `docs/essentials/register-nav-items.md` and `docs/reference/runtime/FireflyRuntime.md` both said *"Be sure to use a unique identifier"* as advice for avoiding menu flicker, without stating that a duplicate throws, and without saying that the constraint is per-menu. Two sections in two different menus have always been intended to be free to share an `$id`, though a key-collision defect fixed in [#671](https://github.com/workleap/wl-squide/pull/671) meant that they were not in every case.

The workaround the throw forced is a `Set` of already-declared section ids, cleared on `DeferredRegistrationsUpdateStartedEvent`:

```ts
const registeredSections = new Set<string>();

runtime.eventBus.addListener(DeferredRegistrationsUpdateStartedEvent, () => registeredSections.clear());

return (deferredRuntime, data) => {
    if (!registeredSections.has("billing")) {
        registeredSections.add("billing");
        deferredRuntime.registerNavigationItem({ $id: "billing", $label: "Billing", children: [] });
    }

    deferredRuntime.registerNavigationItem({ $id: "invoices", $label: "Invoices", to: "/invoices" }, { sectionId: "billing" });
};
```

It was documented in `agent-skills/workleap-squide/references/patterns.md` and in `docs/reference/testing/createDeferredRegistrationsRunner.md`. Two things are wrong with it.

It only covers one of the two cases. The `Set` lives in a module's closure, so it stops *that* module from declaring the section on each of its items within one run. It does nothing about two modules declaring the same section, which is what a shared section is.

The check-then-act it performs is order-dependent. Deferred registration functions are `async` and are executed under `Promise.allSettled` — `packages/core/src/registration/LocalModuleRegistry.ts:182` and `:254`, and `packages/firefly-module-federation/src/RemoteModuleRegistry.ts:247` and `:325` for remote modules. A function that awaits anything before registering has no defined position relative to the others, so which module reaches the section first is not determined by module order. Under the throw, that decides which module crashes.

So the throw did not enforce a documented invariant, it did not cover the case that needed covering, and the guard it forced was itself order-dependent. ADR-0024 removed the implementation reason it had to exist; what replaces it is a separate decision.

## Options Considered

1. **Keep throwing.** Status quo, with no implementation reason left behind it. It preserves an eager diagnostic for a genuine `$id` collision — two unrelated sections that happen to share an id — at the cost of everything above.
2. **Merge the losing declaration's children into the registered section.** The option that discards nothing a module wrote. Measured, it accumulates: the merged children are attached to a container owned by another registration, so `clearDeferredItems` cannot undo them, because it deletes records and the merge produces none. Three update runs of a module declaring a section with one inline child, against a section a static registration owns, gave `[from-A-static, from-B-deferred, from-B-deferred, from-B-deferred]`. That is the bug ADR-0023 was written for, reintroduced through a different door.
3. **A separate declaration API.** `registerNavigationSection`, or an explicit `{ ensure: true }` option, so that the ensure is opt-in and a plain `registerNavigationItem` with a colliding `$id` keeps throwing eagerly. It answers the loss described under the Decision below, and the release is a major, so the API surface was open. It splits one concept across two functions: every module contributing to a shared section then has to know which one to call, and getting it wrong is silent in one direction and a crash in the other. A section is a navigation item, and registering one is `registerNavigationItem`.
4. **First declaration wins, silently.** No accumulation and no throw. A declaration that carried inline children, a `$priority`, or a `sectionId` disappears with nothing said, which is the silent navigation corruption [ADR-0022](./0022-deferred-registration-update-reporting.md) is about.
5. **First declaration wins, and the declarations that lost are recorded and reported by `_validateRegistrations`.**

## Decision

**Option 5.** A section `$id` identifies a container within a menu. Declaring it is an ensure: the first declaration creates the container, later ones find it already there and contribute nothing. `registerNavigationItem` reports the outcome as `"deduplicated"`, and logs a debug line saying so at registration time.

**A declaration that loses creates no registration record.** It is not merged and it is not kept as an alternative, which is what puts option 2's accumulation out of reach rather than merely making it unlikely — there is nothing for a clear to fail to remove. A module contributing to a shared section nests its items under it with the `sectionId` option, which is the documented mechanism and the one that already worked.

There is one exception, and it is a different situation rather than the same one. A section that is waiting for its own section does not compete for the identifier while it waits, per ADR-0024's first invariant. If it later becomes reachable and finds the identifier taken, it keeps everything it registered — its place in the menu, its children — and loses only the identifier. That declaration is recorded too, and is reported separately, because a section that renders is not an ignored declaration.

**The failure moves to validation.** Each declaration that lost is recorded, and `_validateRegistrations` reports them through `#validateNavigationSectionDeclarations`: development throws, production logs, and `strictMode={false}` on `AppRouter` remains the single opt-out. This matches the pending-registration checks in the same function, though not `#validateRouteRegistrations`, which throws in both modes. Validation is the right place for it, because at the moment `registerNavigationItem` returns, the registry cannot know whether the declaration that lost was a benign re-declaration or a real conflict — the run that would settle it has not finished.

**Only a declaration that would have contributed something is reported.** For a declaration that lost outright, that means inline `children`, a `$priority`, a `sectionId` of its own, or a string `$label` that is not the registered one. A declaration written inside another section's `children` is reported as well. It carries no option saying so, but it is dropped from where it was written, together with everything declared under it. A bare `{ $id, $label, children: [] }` re-declaration registered at the root of a menu is the supported shape for contributing to a section that no module owns, so reporting it would make the recommended pattern noisy in strict mode and train applications to turn strict mode off. A declaration that kept its place and lost only the identifier is always reported, whatever it carries: two sections of one menu answering to the same `$id` is never intended, and nesting with that `$id` silently reaches only one of them.

`$label` is compared only when both sides are strings. It is a `ReactNode`, rebuilt on every registration, so two modules rendering the same label through their own element hold different objects and comparing those would report every correctly shared section. Two strings are the case where a difference means what it looks like, and it is the shape an accidental collision usually takes, so a declaration whose string `$label` is not the registered one is reported. Where either side is an element the disagreement stays invisible, and the surviving `$label` is still the one of the declaration that ran first.

Under ensure semantics the surviving section's `$label`, `$priority`, `$meta`, `$additionalProps` and `$canRender` all come from the first declaration, and per the `Promise.allSettled` above, "first" is not deterministic across modules. That is why identical declarations are the supported shape for a shared section. It is not a regression: the same non-determinism was already there and was already load-bearing, deciding which module got the throw. A non-deterministic outcome replaces a non-deterministic crash, and the outcome is a working menu.

What is given up is the eager diagnostic for a genuine `$id` collision, where two sections that are meant to be different accidentally share an id. The validation catches the ones that carry something, which covers a section a module means to own. What stays silent is a collision between two sections that are empty, unprioritized, both declared at the root of a menu, and whose labels are not two strings that differ. That is accepted: at that point the input is the supported shared-section pattern, and no rule the registry can apply separates them. One case stays silent for a different reason. A declaration registered at the root loses its position when the section that owns the identifier was itself declared inside another section, because the registry compares identifiers rather than positions. The consequence for consumers is a naming discipline rather than an enforcement: a section `$id` is a name in a menu-wide namespace that every module shares, so it needs to be specific enough not to collide by accident. The documentation says that now, in place of recommending uniqueness without saying why.

Evidence: `packages/react-router/src/NavigationItemRegistry.ts` (`#recursivelyAddRegistrations`, `#addSectionIndex`, `#addDuplicateDeclaration`, `#deleteDuplicateDeclarations`, `DuplicateNavigationSectionDeclarations`), `packages/react-router/src/ReactRouterRuntime.ts` (`#validateNavigationSectionDeclarations`). Migration guide: `docs/updating/migrate-to-firefly-v19.0.md`.

## Consequences

- Several modules can declare the same navigation section, in any order, and get one section. It removes the ownership coupling the throw imposed.
- The `Set` workaround is obsolete. Code that keeps it is not broken by this, the guard simply becomes redundant, so removing it is a cleanup rather than a migration.
- An application that relied on the throw as a duplicate-id check loses the eager failure and gets a validation-time report instead, on the declarations that carried something. The message names the menu, the section, and what each one would have contributed.
- A section's identity-bearing options are first-writer-wins. Two modules declaring `Settings` with different `$label`s produce one section carrying one of the two, non-deterministically. The disagreement is reported when both labels are strings, and is invisible when either is an element. Declare a shared section identically, or give it an owner.
- `NavigationItemRegistrationStatus` gained a `"deduplicated"` value, which amends [ADR-0022](./0022-deferred-registration-update-reporting.md). Its reachability analysis applies unchanged: the union is exported through `@squide/firefly` and a consumer narrowing exhaustively gets a compile error. Its semver conclusion does not — this value ships inside a major.
- A section that is waiting for a section that was never registered does not claim its `$id`. It holds nothing any menu shows, so a later real declaration wins the identifier, and the waiting one stays pending and stays reported.
- Declarations that lost outright during a deferred run are discarded by `clearDeferredItems`, static ones are kept. A static misconfiguration is reported for the life of the session, matching how static pending registrations already behave under ADR-0022, and a deferred one is re-derived by each run. A declaration that kept its place is discarded whatever its registration type, since the rebuild records it again for every section it reaches.
- Nothing under an ignored declaration is examined. A section declared inside a declaration that lost is dropped with it, and is not reported on its own. What the report names is the declaration that was dropped, which is the one the author can act on.
- When several sections of one menu contend for the same `$id`, which one wins can change after an update run. The rebuild indexes the menu roots before the items that were waiting on a section, and that order need not match the order the registrations first ran in. The contention is reported either way, and a correctly configured application has none.
- The registry keeps a small amount of state that exists only to be reported, one entry per losing declaration. It is bounded by the number of duplicate declarations, which is zero for a correctly configured application.
