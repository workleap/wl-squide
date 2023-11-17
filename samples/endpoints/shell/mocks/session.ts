import { LocalStorageSessionManager } from "@squide/fakes";

export interface Session {
    userId: number;
    username: string;
    preferredLanguage: string;
}

export const sessionManager = new LocalStorageSessionManager<Session>({ key: "squide-endpoints-msw-session" });
