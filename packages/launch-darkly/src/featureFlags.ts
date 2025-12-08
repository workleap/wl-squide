// The "FeatureFlags" interface is expected to be extended by the consumer application.
// This magic is called module augmentation: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FeatureFlags {}

export type FeatureFlagKey = keyof FeatureFlags;
