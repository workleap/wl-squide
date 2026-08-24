---
"@squide/react-router": minor
"@squide/firefly": minor
---

Navigation items registered by a deferred registration function are now copied by the registry, so registering the same object on more than one run no longer accumulates children.

The registry attaches a nested item by pushing onto the `children` array of the section it indexes, and that section was the object the module passed in. A module holding its section at module scope and registering it again on every deferred registration update therefore grew that array by one item per run. A section holding a single link rendered three copies of it after two feature flag flips.

You were affected if a module registers a navigation section from a deferred registration function and reuses the same object across runs. The fix is in the framework, no application change is required.

Only the deferred path is copied, the static registration phase runs once and cannot accumulate. The copy preserves property descriptors, so a section backed by a class instance keeps its prototype and a `$label` getter stays lazy. What changes observably is that mutating your own navigation item after registering it no longer updates the live menu on the deferred path.
