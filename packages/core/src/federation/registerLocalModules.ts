import type { AbstractRuntime } from "../runtime/abstractRuntime.ts";
import type { ModuleRegistrationStatus } from "./moduleRegistrationStatus.ts";
import type { ModuleRegisterFunction } from "./registerModule.ts";

let registrationStatus: ModuleRegistrationStatus = "none";

// Aliasing to make the name more explicit to external modules.
export { registrationStatus as localModulesRegistrationStatus };

export interface RegisterLocalModulesOptions<TContext> {
    context?: TContext;
}

export function registerLocalModules<TRuntime extends AbstractRuntime = AbstractRuntime, TContext = unknown>(registerFunctions: ModuleRegisterFunction<TRuntime, TContext>[], runtime: TRuntime, { context }: RegisterLocalModulesOptions<TContext> = {}) {
    if (registrationStatus !== "none") {
        throw new Error("[squide] The \"registerLocalModules\" function can only be called once.");
    }

    registrationStatus = "in-progress";

    runtime.logger.information(`[squide] Found ${registerFunctions.length} local module${registerFunctions.length !== 1 ? "s" : ""} to register.`);

    registerFunctions.forEach((x, index) => {
        runtime.logger.information(`[squide] ${index + 1}/${registerFunctions.length} Registering local module${registerFunctions.length !== 1 ? "s" : ""}.`);

        x(runtime, context);

        runtime.logger.information(`[squide] ${index + 1}/${registerFunctions.length} Local module${registerFunctions.length !== 1 ? "s" : ""} registration completed.`);
    });

    registrationStatus = "ready";
}
