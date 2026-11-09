// Importing a bootstrap file is required when sharing dependencies between the host and the remotes.
// Otherwise we get: Uncaught Error: Shared module is not available for eager consumption
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore doesn't support file extension.
import("./bootstrap");

// TS1208: 'index.ts' cannot be compiled under '--isolatedModules' because it is considered a global script file. Add an import, export, or an
// empty 'export {}' statement to make it a module.
export {};
