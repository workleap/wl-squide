export * from "./shared/assertions.ts";

export {
    RootMenuId,
    Runtime,
    RuntimeScope,
    type CompleteDeferredRegistrationScopeOptions,
    type GetNavigationItemsOptions,
    type IRuntime,
    type ModuleManagerFactory,
    type PluginFactory,
    type RegisterNavigationItemOptions,
    type RegisterRouteOptions,
    type RuntimeMethodOptions,
    type RuntimeMode,
    type RuntimeOptions,
    type StartDeferredRegistrationScopeOptions,
    type ValidateRegistrationsOptions
} from "./runtime/runtime.ts";

export * from "./runtime/RuntimeContext.ts";
export * from "./runtime/useEventBus.ts";
export * from "./runtime/useLogger.ts";
export * from "./runtime/usePlugin.ts";
export * from "./runtime/useRuntimeMode.ts";

export * from "./messaging/eventBus.ts";
export * from "./messaging/useEventBusDispatcher.ts";
export * from "./messaging/useEventBusListener.ts";

export {
    LocalModuleDeferredRegistrationFailedEvent,
    LocalModuleDeferredRegistrationUpdateFailedEvent,
    LocalModuleRegistrationFailedEvent,
    LocalModuleRegistry,
    LocalModulesDeferredRegistrationCompletedEvent,
    LocalModulesDeferredRegistrationStartedEvent,
    LocalModulesDeferredRegistrationsUpdateCompletedEvent,
    LocalModulesDeferredRegistrationsUpdateStartedEvent,
    LocalModulesRegistrationCompletedEvent,
    LocalModulesRegistrationStartedEvent,
    type LocalModulesDeferredRegistrationCompletedEventPayload,
    type LocalModulesDeferredRegistrationStartedEventPayload,
    type LocalModulesDeferredRegistrationsUpdateCompletedEventPayload,
    type LocalModulesDeferredRegistrationsUpdateStartedEventPayload,
    type LocalModulesRegistrationCompletedEventPayload,
    type LocalModulesRegistrationStartedEventPayload
} from "./registration/LocalModuleRegistry.ts";

export { ModuleManager } from "./registration/ModuleManager.ts";

export * from "./registration/mergeDeferredRegistrations.ts";
export * from "./registration/moduleRegistry.ts";
export * from "./registration/registerModule.ts";

export * from "./plugins/plugin.ts";

