import "@squide/firefly";

declare module "@squide/firefly" {
    interface EnvironmentVariables {
        authenticationApiBaseUrl: string;
        featureFlagsApiBaseUrl: string;
        otherFeatureFlagsApiUrl: string;
        sessionApiBaseUrl: string;
        subscriptionApiBaseUrl: string;
    }
}
