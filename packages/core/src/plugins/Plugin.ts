import type { DeferredRegistrationOperation } from "../registration/registerModule.ts";
import { Runtime } from "../runtime/Runtime.ts";

export type DeferredRegistrationScopeCompletionFunction = () => void;

export interface DeferredRegistrationScopeOptions {
    operation: DeferredRegistrationOperation;
    transactional: boolean;
}

export abstract class Plugin<TRuntime extends Runtime = Runtime> {
    protected readonly _name: string;
    protected readonly _runtime: TRuntime;

    constructor(name: string, runtime: TRuntime) {
        this._name = name;
        this._runtime = runtime;
    }

    get name() {
        return this._name;
    }

    // Optional lifecycle hook, executed when a deferred registration scope starts, before any module's
    // deferred registration function runs. A plugin owning a registry that modules fill from their deferred
    // registration functions implements this hook to clear the entries of the previous run, otherwise those
    // entries outlive the condition that registered them.
    //
    // The returned function, if any, is executed once the run has settled, before the runtime completes its
    // own scope. It's the place to commit a buffered registry. It must not read the runtime's navigation
    // items: on an update run, the items of that run are not committed yet.
    //
    // IMPORTANT: Both this hook and the function it returns must be synchronous. Nothing awaits them because
    // of the Honeycomb "active spans" constraint documented in ModuleManager.
    //
    // IMPORTANT: This must stay an optional *method* signature. Declaring it as an optional property
    // ("onDeferredRegistrationScopeStarted?: (options) => ...") emits a class field, which shadows the
    // prototype method of every subclass and silently disables the hook.
    onDeferredRegistrationScopeStarted?(options: DeferredRegistrationScopeOptions): DeferredRegistrationScopeCompletionFunction | void;
}
