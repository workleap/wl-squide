---
"@squide/core": patch
"@squide/firefly-module-federation": patch
---

Fixed the module registries running their success logging on the error path. The `Successfully registered...` log sat after the `try/catch` rather than inside the `try`, so a module or deferred registration that failed had its failure logged and then, immediately after, a success written to the same logger scope.

Both loggers that implement a logger scope today, `@workleap/logging` and `@workleap/logrocket`, buffer a scope's logs and flush them from `end()`, and both ignore a second `end()` call. The error path had already ended the scope, so the stray log was queued and then discarded rather than displayed. Console and session replay output is therefore unchanged, and you were only affected if your application registers a logger that writes each log as it is called.

`registerModules`, `registerDeferredRegistrations` and `updateDeferredRegistrations` are fixed on the local registry, along with the two deferred registration functions on the remote one. `RemoteModuleRegistry.registerModules` was already correct and is the shape the other five now match.
