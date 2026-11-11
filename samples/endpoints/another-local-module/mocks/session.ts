import { FakeSessionStorageKey } from "@endpoints/shared";
import { LocalStorageSessionAccessor } from "@squide/fakes";

export interface Session {
    userId: number;
    username: string;
    preferredLanguage: string;
}

export const sessionAccessor = new LocalStorageSessionAccessor<Session>({ key: FakeSessionStorageKey });
