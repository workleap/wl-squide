import type { AbstractRuntime } from "../runtime/abstractRuntime.ts";
import type { ModuleRegistrationStatus } from "./moduleRegistrationStatus.ts";
import type { ModuleRegisterFunction } from "./registerModule.ts";

let registrationStatus: ModuleRegistrationStatus = "none";

// Aliasing to make the name more explicit to external modules.
export { registrationStatus as localModulesRegistrationStatus };

export function resetLocalModulesRegistrationStatus() {
    registrationStatus = "none";
}

export interface LocalModuleRegistraError {
    // The registration error.
    error: unknown;
}

export interface RegisterLocalModulesOptions<TContext> {
    context?: TContext;
}

export function registerLocalModules<TRuntime extends AbstractRuntime = AbstractRuntime, TContext = unknown>(registerFunctions: ModuleRegisterFunction<TRuntime, TContext>[], runtime: TRuntime, { context }: RegisterLocalModulesOptions<TContext> = {}) {
    if (registrationStatus !== "none") {
        throw new Error("[squide] [local] registerLocalModules() can only be called once.");
    }

    const errors: LocalModuleRegistraError[] = [];

    runtime.logger.information(`[squide] [local] Found ${registerFunctions.length} local module${registerFunctions.length !== 1 ? "s" : ""} to register.`);

    registrationStatus = "in-progress";

    registerFunctions.forEach((x, index) => {
        runtime.logger.information(`[squide] [local] ${index + 1}/${registerFunctions.length} Registering local module.`);

        try {
            x(runtime, context);
        } catch (error: unknown) {
            runtime.logger.error(
                `[squide] [local] ${index + 1}/${registerFunctions.length} An error occured while registering a local module.`,
                error
            );

            errors.push({
                error
            });
        }

        runtime.logger.information(`[squide] [local] ${index + 1}/${registerFunctions.length} Local module registration completed.`);
    });

    registrationStatus = "ready";

    return errors;
}
