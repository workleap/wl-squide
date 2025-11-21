import { EnvironmentVariables } from "@squide/firefly";
import { HttpResponse, http, type HttpHandler } from "msw";
import { featureFlagsManager } from "./featureFlags.ts";
import { simulateDelay } from "./simulateDelay.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getFeatureFlagsHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        http.get(`${environmentVariables.featureFlagsApiBaseUrl}getAll`, async () => {
            const featureFlags = featureFlagsManager.getFeatureFlags();

            await simulateDelay(500);

            return HttpResponse.json(featureFlags);
        }),

        http.post(`${environmentVariables.featureFlagsApiBaseUrl}shuffle`, () => {
            const newFeatureFlags = {
                featureA: Math.random() < 0.5,
                featureB: true,
                featureC: Math.random() < 0.5,
                // Not ideal but fine for now as now mocks are currently depending on these 2 feature flags.
                otherA: false,
                otherB: false
            };

            featureFlagsManager.setFeatureFlags(newFeatureFlags);

            console.log("[endpoints] New feature flags are:", newFeatureFlags);

            return new HttpResponse(null, {
                status: 200
            });
        }),

        http.post(`${environmentVariables.featureFlagsApiBaseUrl}deactivateFeatureB`, () => {
            featureFlagsManager.setFeatureFlags({
                featureA: true,
                featureB: false,
                featureC: true,
                // Not ideal but fine for now as now mocks are currently depending on these 2 feature flags.
                otherA: false,
                otherB: false
            });

            return new HttpResponse(null, {
                status: 200
            });
        })
    ];
}
