import type { EnvironmentVariables } from "@squide/env-vars";
import { HttpResponse, http, type HttpHandler } from "msw";
import { sessionManager } from "./session.ts";
import { simulateDelay } from "./simulateDelay.ts";

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getSessionHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        http.get(`${environmentVariables.sessionApiBaseUrl}getSession`, async () => {
            const session = sessionManager.getSession();

            if (!session) {
                return new HttpResponse(null, {
                    status: 401
                });
            }

            await simulateDelay(500);

            return HttpResponse.json(session);
        }),
        http.post(`${environmentVariables.sessionApiBaseUrl}updateSession`, () => {
            const session = sessionManager.getSession();

            if (!session) {
                return new HttpResponse(null, {
                    status: 401
                });
            }

            sessionManager.setSession({
                userId: session.userId,
                username: Math.random().toString(20),
                preferredLanguage: session.preferredLanguage
            });

            return new HttpResponse(null, {
                status: 200
            });
        })
    ];
}
