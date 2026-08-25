---
"@squide/core": patch
"@squide/firefly-module-federation": patch
---

Fixed the module registries reporting a failed module or deferred registration as successfully registered. The success log sat after the `try/catch` rather than inside the `try`, so it also ran on the error path, immediately after the failure was logged.

Both loggers that implement a logger scope today, `@workleap/logging` and `@workleap/logrocket`, buffer a scope's logs and flush them from `end()`, and both ignore a second `end()` call. The error path had already ended the scope, so the stray log was queued and then discarded rather than displayed. Console and session replay output is therefore unchanged, and you were only affected if your application registers a logger that writes each log as it is called.

`registerModules`, `registerDeferredRegistrations` and `updateDeferredRegistrations` are fixed on the local registry, along with the two deferred registration functions on the remote one. `RemoteModuleRegistry.registerModules` was already correct and is the shape the other five now match.
