export { i18nextInstanceRegistry, type i18nextInstanceRegistryEntry, type LoadResourcesFunction, type RegisterInstanceOptions } from "./i18nextInstanceRegistry.ts";
export { I18nextNavigationItemLabel, type I18nextNavigationItemLabelProps } from "./I18nextNavigationItemLabel.tsx";
export {
    findSupportedPreferredLanguage,
    getI18nextPlugin,
    I18nextResourcesLoadFailedEvent,
    i18nextPlugin,
    i18nextPluginName,
    type I18nextResourcesLoadFailedEventPayload,
    type i18nextPluginOptions,
    type LanguageChangedListener
} from "./i18nextPlugin.ts";
export { I18nextResourcesLoadError, isI18nextResourcesLoadError } from "./I18nextResourcesLoadError.ts";
export { useChangeLanguage } from "./useChangeLanguage.ts";
export { useCurrentLanguage } from "./useCurrentLanguage.ts";
export { useI18nextInstance } from "./useI18nextInstance.ts";
