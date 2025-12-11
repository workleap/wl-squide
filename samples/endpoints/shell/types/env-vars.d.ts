import "@squide/firefly";

declare module "@squide/firefly" {
    interface EnvironmentVariables {
        authenticationApiBaseUrl: string;
        userInfoApiBaseUrl: string;
        userRoleApiBaseUrl: string;
        sessionApiBaseUrl: string;
        subscriptionApiBaseUrl: string;
    }
}
