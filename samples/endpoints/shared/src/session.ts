import { createContext, useContext } from "react";
import type { LanguageKey } from "./i18next.ts";

export const FakeSessionStorageKey = "squide-endpoints-msw-session-v2";

export interface Session {
    user: {
        id: string;
        name: string;
        preferredLanguage: LanguageKey;
    };
}

export interface SessionManager {
    getSession: () => Session | undefined;
    clearSession: () => void;
}

export const SessionManagerContext = createContext<SessionManager | undefined>(undefined);

export function useSessionManager() {
    return useContext(SessionManagerContext);
}

export function useSession() {
    const sessionManager = useSessionManager();

    return sessionManager?.getSession();
}

export function useIsAuthenticated() {
    const sessionManager = useSessionManager();

    return !!sessionManager?.getSession();
}

