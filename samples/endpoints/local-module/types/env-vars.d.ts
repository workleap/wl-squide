import "@squide/firefly";

declare module "@squide/firefly" {
    interface EnvironmentVariables {
        rickAndMortyApiBaseUrl: string;
        featureApiBaseUrl: string;
    }
}
