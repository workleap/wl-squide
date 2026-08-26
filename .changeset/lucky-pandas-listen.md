---
"@squide/react-router": minor
"@squide/firefly": minor
---

Fixed the navigation section index treating two different `(menuId, sectionId)` pairs as one.

The index keyed on `` `${menuId}-${sectionId}` ``, and a `-` is legal in both values, so `("analytics", "sidebar-performance")` and `("analytics-sidebar", "performance")` produced the same key. Three things could follow when an application had two menus whose ids differ on a `-` boundary, such as `analytics` and `analytics-sidebar`:

- A nested navigation item could attach to the **wrong menu's** section, while the registration result still reported `registrationStatus: "registered"` with the correct `menuId`.
- Two genuinely distinct sections could collide on `A navigation section index has already been registered for the menu`.
- Strict mode could report one missing navigation section when two were missing, and name only one of them.

Both indexes are now keyed by the pair itself rather than by a string joining the two values, so no separator exists and the collision is not representable. See [ADR-0022](https://github.com/workleap/wl-squide/blob/main/agent-docs/adr/0022-section-index-keyed-by-pair.md) for why a rarer separator was rejected: it relocates the assumption instead of removing it.

**This defect was described once before.** It was fixed in `@squide/react-router@9.3.0` / `@squide/firefly@18.4.0`, then withdrawn by the revert in `9.4.0` / `18.5.0` because it had shipped bundled with three other changes. Those changelog entries still stand and are accurate for those versions. This is the same defect being fixed again, on its own this time, and it is the piece the revert notes tracked for re-landing.

## New API

- **`PendingNavigationItemRegistrations.getPendingSections()`** returns `{ menuId, sectionId, items }[]`, identifying each pending section by its pair rather than by an index key.

## Deprecated

The index key is no longer part of the public surface, so nothing hands you one to hold. All three are removed at the next major.

- `getPendingSectionIds()` — returns keys that cannot identify a section on their own. Use `getPendingSections()`.
- `getPendingRegistrationsForSection(indexKey)` — takes a key as a parameter, so a key you build yourself is not guaranteed to match the registry's. Use `getPendingSections()`.
- `parseSectionIndexKey` — already deprecated, unchanged.

For compatibility the two accessors still work and still speak the historical `` `${menuId}-${sectionId}` `` format, synthesized on demand. Where two pairs synthesize the same key that view returns the union of their items rather than dropping one, so it remains ambiguous by construction — which is why it is deprecated. Registration itself is exact.

This is the third time the key format has changed. Because consumers are no longer given a key, it is intended to be the last.
