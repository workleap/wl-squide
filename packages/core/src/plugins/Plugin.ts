import type { DeferredRegistrationOperation } from "../registration/registerModule.ts";
import { Runtime } from "../runtime/Runtime.ts";

/**
 * Commits whatever a plugin accumulated during a deferred registration run. Must be synchronous.
 */
export type DeferredRegistrationScopeCompletionFunction = () => void;

export interface DeferredRegistrationScopeOptions {
    /**
     * "register" for the initial run, "update" for every subsequent update run.
     */
    operation: DeferredRegistrationOperation;

    /**
     * "false" for the initial run, "true" for every update run. A transactional run should buffer its
     * registrations and commit them from the completion function. A non transactional run must write
     * through: the modules become ready while that scope is still open, so anything rendering at that
     * point must already see the entries.
     */
    transactional: boolean;
}

/**
 * Executed when a plugin becomes ready.
 */
export type PluginReadyListener = () => void;

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

    /**
     * Optional. Executed when a deferred registration run starts, before any module's deferred
     * registration function. Implement it to clear and replay a registry that modules fill from their
     * deferred registration functions, otherwise its entries outlive the condition that registered them.
     *
     * Return a function to be executed once the run has settled, while the runtime's scope is still open.
     * It's the place to commit a buffered registry, and it must not read the runtime's navigation items:
     * on an update run, the items of that run are not committed yet.
     *
     * Both this method and the function it returns must be synchronous, nothing awaits them. An error
     * thrown by either is logged and swallowed, it never fails the run.
     *
     * @remarks
     * This must stay an optional *method* signature. Declared as an optional property, it emits a class
     * field that shadows the prototype method of every subclass and silently disables the hook.
     */
    onDeferredRegistrationScopeStarted?(options: DeferredRegistrationScopeOptions): DeferredRegistrationScopeCompletionFunction | void;

    /**
     * Optional. Indicates whether the asynchronous work the application must wait for before rendering has settled,
     * such as loading the resources of the requested language. A plugin that doesn't implement it is always
     * considered ready.
     *
     * It's a status rather than a latch: it returns "false" again when new work starts, and "true" once that work
     * has settled. The application consults it once every other bootstrapping input is ready and holds the render
     * until it returns "true", then never consults it again: work started once the application is bootstrapped
     * doesn't hold anything.
     *
     * @remarks
     * This must stay an optional *method* signature. Declared as an optional property, it emits a class
     * field that shadows the prototype method of every subclass and silently disables the surface.
     */
    isReady?(): boolean;

    /**
     * Optional. Registers a listener executed every time the plugin becomes ready. A plugin that is already ready
     * doesn't execute a listener registered afterwards until its next transition, therefore a consumer must read
     * {@link isReady} first.
     *
     * @remarks
     * This must stay an optional *method* signature, for the same reason as {@link isReady}.
     */
    registerReadyListener?(callback: PluginReadyListener): void;

    /**
     * Optional. Removes a listener registered with {@link registerReadyListener}.
     *
     * @remarks
     * This must stay an optional *method* signature, for the same reason as {@link isReady}.
     */
    removeReadyListener?(callback: PluginReadyListener): void;
}
