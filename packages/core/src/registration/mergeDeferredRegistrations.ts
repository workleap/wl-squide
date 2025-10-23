import type { Runtime } from "../runtime/runtime.ts";
import { isFunction } from "../shared/assertions.ts";
import type { DeferredRegistrationFunction } from "./registerModule.ts";

export function mergeDeferredRegistrations<TRuntime extends Runtime, TData>(candidates: (DeferredRegistrationFunction<TRuntime, TData> | void)[]) {
    const deferredRegistrations = candidates.filter(x => isFunction(x));

    if (deferredRegistrations.length === 0) {
        return;
    }

    if (deferredRegistrations.length === 1) {
        return deferredRegistrations[0];
    }

    const mergeFunction: DeferredRegistrationFunction<TRuntime, TData> = async (runtime, data, state) => {
        for (const x of deferredRegistrations) {
            await x(runtime, data, state);
        }
    };

    return mergeFunction;
}
