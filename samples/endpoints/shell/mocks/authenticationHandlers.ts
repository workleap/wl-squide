import type { EnvironmentVariables } from "@squide/env-vars";
import { HttpResponse, http, type HttpHandler } from "msw";
import { sessionManager } from "./session.ts";
import { simulateDelay } from "./simulateDelay.ts";

interface LoginCredentials {
    username: string;
    password: string;
}

const Users = [
    {
        userId: Math.random(),
        username: "temp",
        preferredLanguage: "en-US",
        password: "temp"
    },
    {
        userId: Math.random(),
        username: "fr",
        preferredLanguage: "fr-CA",
        password: "fr"
    }
];

// Must specify the return type, otherwise we get a TS2742: The inferred type cannot be named without a reference to X. This is likely not portable.
// A type annotation is necessary.
export function getAuthenticationHandlers(environmentVariables: EnvironmentVariables): HttpHandler[] {
    return [
        http.post(`${environmentVariables.authenticationApiBaseUrl}login`, async ({ request }) => {
            const { username, password } = await request.json() as LoginCredentials;

            const user = Users.find(x => {
                return x.username === username && x.password === password;
            });

            if (!user) {
                return new HttpResponse(null, {
                    status: 401
                });
            }

            await simulateDelay(1000);

            sessionManager.setSession({
                userId: user.userId,
                username: user.username,
                preferredLanguage: user.preferredLanguage
            });

            return new HttpResponse(null, {
                status: 200
            });
        }),

        http.post(`${environmentVariables.authenticationApiBaseUrl}logout`, () => {
            sessionManager.clearSession();

            return new HttpResponse(null, {
                status: 200
            });
        })
    ];
}
