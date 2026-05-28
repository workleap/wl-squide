---
"@squide/core": minor
"@squide/react-router": minor
"@squide/firefly": minor
---

Added `runtime.getNavigationItemsByMenu()` plus the matching `useRuntimeNavigationItemsByMenu` (`@squide/react-router`) and `useNavigationItemsByMenu` (`@squide/firefly`) hooks. The new APIs return the full navigation registry as a `Map<string, NavigationItem[]>` grouped by menu id. The returned map is a fresh, mutation-safe copy and is reference-stable across calls/renders until the registry changes (registration, deferred completion, or clear).
