import type { Session } from "./session.ts";
import { UserRole } from "./userRole.ts";

export interface UserInfo {
    email: string;
    createdAt: string;
    status: string;
}

export interface DeferredRegistrationData {
    session?: Session;
    userInfo?: UserInfo;
    role: UserRole;
}
