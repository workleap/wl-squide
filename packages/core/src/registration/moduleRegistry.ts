import type { Runtime } from "../runtime/runtime.ts";

export type ModuleRegistrationStatus = "none" | "registering-modules" | "modules-registered" | "registering-deferred-registration" | "ready";

export interface RegisterModulesOptions<TContext> {
    context?: TContext;
}

export type ModuleRegistrationStatusChangedListener = () => void;

export class ModuleRegistrationError extends Error {}

export abstract class ModuleRegistry {
    abstract registerModules<TRuntime extends Runtime = Runtime, TContext = unknown>(modules: unknown, runtime: TRuntime, options?: RegisterModulesOptions<TContext>): Promise<ModuleRegistrationError[]>;

    abstract registerDeferredRegistrations<TRuntime extends Runtime = Runtime, TData = unknown>(data: TData, runtime: TRuntime): Promise<ModuleRegistrationError[]>;

    abstract updateDeferredRegistrations<TRuntime extends Runtime = Runtime, TData = unknown>(data: TData, runtime: TRuntime): Promise<ModuleRegistrationError[]>;

    abstract registerStatusChangedListener(callback: ModuleRegistrationStatusChangedListener): void;

    abstract removeStatusChangedListener(callback: ModuleRegistrationStatusChangedListener): void;

    abstract get registrationStatus(): ModuleRegistrationStatus;
}
