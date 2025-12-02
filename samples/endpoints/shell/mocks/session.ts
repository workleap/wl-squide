import { FakeSessionStorageKey } from "@endpoints/shared";
import { LocalStorageSessionManager } from "@squide/fakes";

export interface Session {
    userId: string;
    username: string;
    preferredLanguage: string;
}

export const sessionManager = new LocalStorageSessionManager<Session>({ key: FakeSessionStorageKey });
