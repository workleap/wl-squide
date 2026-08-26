# ADR-0022: The navigation section index is keyed by the (menuId, sectionId) pair

## Status

accepted

## Context

`NavigationItemRegistry` keeps two lookups that are addressed by a menu and a section together: `#sectionsIndex`, which finds the parent of a nested item, and `#pendingRegistrationsIndex`, which holds items whose section has not been registered yet.

Both used a single string built by joining the two values: `` `${menuId}-${sectionId}` ``. A `-` is legal in a `menuId` and in a section `$id`, so two different pairs could produce one key. `("analytics", "sidebar-performance")` and `("analytics-sidebar", "performance")` both joined to `"analytics-sidebar-performance"`.

Three symptoms followed, all reproduced before this change:

- **A nested item attached to the wrong menu's section** while the registry reported `registrationStatus: "registered"` with the correct `menuId`. A navigation item crossed a menu boundary silently, which is the serious one.
- **Two genuinely distinct sections collided** on `A navigation section index has already been registered for the menu`.
- **Strict mode under-reported.** Two pending pairs merged into one entry, so the validation message said one item was missing when two were, and named only one of them.

The trigger needs two or more menus whose ids differ on a separator boundary — `analytics` and `analytics-sidebar`, `main` and `main-menu`. That is idiomatic but not accidental, which is consistent with the defect going unnoticed since `d3f7b9c6a` (2024-09-22).

This is the third time the key format has been revisited. A previous attempt swapped `-` for the NUL character and was reverted along with the rest of `fb2669e98`.

## Options Considered

1. **A rarer separator** (NUL, or another character unlikely to appear in an id) — the smallest diff, and what the reverted attempt did. It relocates the assumption rather than removing it: a `menuId` containing the new separator still collides, nothing validates ids, and correctness rests on a convention no type enforces. It also churns the key format a third time while leaving a fourth churn possible.

2. **Validate ids and reject the separator** — makes the collision impossible by narrowing the input space. But it turns a working registration into a throw for ids that are legal today, so it is a breaking change to satisfy an implementation detail.

3. **A length-prefixed key**, `` `${menuId.length}:${menuId}${sectionId}` `` — unconditionally collision-free and still a single string, so the existing key-based accessors keep working unchanged. Keeps a key format that consumers can see and be tempted to build.

4. **Key by the pair itself**, `Map<menuId, Map<sectionId, entry>>` — no separator exists, so no collision is representable. Slightly more code for iteration and cleanup. Removes the concept of an index key from the registry rather than redefining it.

## Decision

Option 4. Both indexes are now `Map<string, Map<string, T>>`, keyed by `menuId` then `sectionId`.

Option 1 was rejected because the lesson of this very defect is that a separator inside a value breaks the key, and a fix whose correctness rests on a separator never appearing inside a value repeats the mistake at lower probability. A test in `NavigationItemRegistrySectionKey.test.ts` measures this rather than asserting it: every single-separator scheme over the fragment alphabet, NUL included, is shown to admit a collision, and keying by the pair is shown to admit none.

Option 3 is genuinely correct and was the runner-up. It lost because it keeps a visible key format, and the key leaking into the public API is the second half of this problem.

**The key is no longer part of the public surface.** `PendingNavigationItemRegistrations.getPendingSections()` returns `{ menuId, sectionId, items }` directly. `getPendingSectionIds()` and `getPendingRegistrationsForSection(indexKey)` are deprecated, and `parseSectionIndexKey` stays deprecated. All three are removed at the next major.

The deprecated accessors were the real compatibility risk, not `parseSectionIndexKey`. `getPendingRegistrationsForSection` takes a key as a *parameter*, so a consumer building `` `${menuId}-${sectionId}` `` to call it would get `[]` back with no error. They are kept working by synthesizing the historical format on demand; where two pairs synthesize the same key, the compatibility view returns the union of their items rather than dropping one. That ambiguity is confined to the two deprecated readers — registration itself is exact.

## Consequences

- The three symptoms are gone, and `#validateNavigationItemRegistrations` now counts and names one entry per real `(menuId, sectionId)` pair.
- The framework no longer calls either deprecated accessor.
- **The key format changes a third time, and this is intended to be the last.** Consumers are no longer given a key to hold, so a fourth change has nothing to break.
- Existing tests asserting `getPendingSectionIds() === ["foo-bar"]` still pass, so the deprecation is not a silent break.
- Iteration and deferred cleanup walk two levels instead of one, and empty inner maps are pruned so `getPendingSections()` never reports a section with no items.
- The guard is a differential test against a reference model that keys by the pair and so cannot collide, rather than assertions on the key format. A format-based suite would have gone green for option 1. An earlier version of the same suite drew ids randomly from a hostile alphabet and passed 521/521 against the unfixed registry: randomness over a hostile alphabet is not adversarial input, and the generators now construct collisions deliberately.
