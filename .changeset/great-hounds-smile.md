---
"@squide/react-router": patch
---

Fixed a failed deferred registration scope completion leaving the runtime unable to update its deferred registrations. The active scope is now always released, so a subsequent feature flag or global data change is no longer rejected with `Cannot start a new deferred registration scope when there's already an active scope`. The error raised by the completion is still propagated.
