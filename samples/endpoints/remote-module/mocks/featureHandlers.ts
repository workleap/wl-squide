import type { EnvironmentVariables } from "@squide/env-vars";
import { HttpResponse, http, type HttpHandler } from "msw";
import { featureFlagsAccessor } from "./featureFlags.ts";
import { sessionAccessor } from "./session.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getFeatureHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        http.get(`${environmentVariables.featureApiBaseUrl}getFeatureB`, () => {
            const session = sessionAccessor.getSession();

            if (!session) {
                return new HttpResponse(null, {
                    status: 401
                });
            }

            const featureFlags = featureFlagsAccessor.getFeatureFlags();

            if (!featureFlags.featureB) {
                return new HttpResponse(null, {
                    status: 403
                });
            }

            const isEn = session.preferredLanguage === "en-US";

            if (isEn) {
                return HttpResponse.json({
                    message: "This page is only available if the <code>featureB</code> flag is active."
                });
            } else {
                return HttpResponse.json({
                    message: "Cette page est uniquement disponible si la fonctionnalité <code>featureB</code> est activé."
                });
            }
        }),

        http.get(`${environmentVariables.featureApiBaseUrl}getFeatureC`, () => {
            const session = sessionAccessor.getSession();

            if (!session) {
                return new HttpResponse(null, {
                    status: 401
                });
            }

            const featureFlags = featureFlagsAccessor.getFeatureFlags();

            if (!featureFlags.featureC) {
                return new HttpResponse(null, {
                    status: 403
                });
            }

            const isEn = session.preferredLanguage === "en-US";

            if (isEn) {
                return HttpResponse.json({
                    message: "This page is only available if the <code>featureC</code> flag is active."
                });
            } else {
                return HttpResponse.json({
                    message: "Cette page est uniquement disponible si la fonctionnalité <code>featureC</code> est activé."
                });
            }
        })
    ];
}
