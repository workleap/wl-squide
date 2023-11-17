import type { LanguageKey } from "./i18n.ts";

export interface Session {
    user: {
        id: number;
        name: string;
        preferredLanguage: LanguageKey;
    };
}

export interface SessionManager {
    setSession: (session: Session) => void;
    getSession: () => Session | undefined;
    clearSession: () => void;
}

export const FakeSessionKey = "squide-endpoints-msw-session";
