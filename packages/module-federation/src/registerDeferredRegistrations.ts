// import { registerLocalModuleDeferredRegistrations, type Runtime } from "@squide/core";
// import { registerRemoteModuleDeferredRegistrations } from "./registerRemoteModules.ts";

// export async function registerDeferredRegistrations<TData = unknown, TRuntime extends Runtime = Runtime>(data: TData, runtime: TRuntime) {
//     runtime.startDeferredRegistrationScope();

//     try {
//         const localModuleErrors = await registerLocalModuleDeferredRegistrations(data, runtime);
//         const remoteModuleErrors = await registerRemoteModuleDeferredRegistrations(data, runtime);

//         return {
//             localModuleErrors,
//             remoteModuleErrors
//         };
//     } finally {
//         runtime.completeDeferredRegistrationScope();
//     }
// }
