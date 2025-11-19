import type { Runtime } from "../runtime/runtime2.ts";

export type DeferredRegistrationOperation = "register" | "update";

export type DeferredRegistrationFunction<TRuntime extends Runtime = Runtime, TData = unknown> = (runtime: TRuntime, data: TData, operation: DeferredRegistrationOperation) => Promise<void> | void;

export type ModuleRegisterFunction<TRuntime extends Runtime = Runtime, TContext = unknown, TData = unknown> = (runtime: TRuntime, context?: TContext) => Promise<DeferredRegistrationFunction<TRuntime, TData> | void> | DeferredRegistrationFunction<TRuntime, TData> | void;

export async function registerModule<TRuntime extends Runtime = Runtime, TContext = unknown, TData = unknown>(register: ModuleRegisterFunction<TRuntime, TContext, TData>, runtime: TRuntime, context?: TContext) {
    return register(runtime, context);
}
