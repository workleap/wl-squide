---
"@squide/react-router": minor
"@squide/firefly": minor
---

Fixed an ambiguity in the section index key that could attach a nested navigation item to the wrong section.

A navigation section is indexed by its `menuId` and its `$id` joined together. They were joined with a `-`, so `("analytics", "sidebar-performance")` and `("analytics-sidebar", "performance")` produced the same key, and two distinct sections of two distinct menus shared a single index entry.

You were affected if a `menuId` or a section `$id` contains a `-` and two such pairs concatenate to the same string. The symptoms were:

- A nested navigation item registered with a `sectionId` was attached to the other menu's section.
- Registering both sections threw `A navigation section index has already been registered for the menu` for two genuinely distinct sections.
- Strict mode reported one missing section instead of two, and named only one of the two pairs.

Keys are now joined with a separator that is not expected to appear in an id. `getPendingSectionIds` still returns these keys, but their content changed. Treat them as opaque, and read the `menuId` and the `sectionId` off the `PendingRegistrationItem` values returned by `getPendingRegistrationsForSection` to identify a section. `parseSectionIndexKey` round-trips correctly again but remains deprecated, the key format is not part of the public contract.

The strict mode message that lists missing sections now says `navigation section` rather than `navigation item`. The number it reports has always been a count of missing sections, each of which can hold several pending registrations.
