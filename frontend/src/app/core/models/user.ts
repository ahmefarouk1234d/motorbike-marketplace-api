import { StoredFile } from './api';

export type Role = "admin" | "buyer" | "seller";


// A user embedded in another document. The listing controller populates
// sellers with 'fullName email' only, so there is nothing else to read.
export interface User {
    _id: string;
    fullName: string;
    email: string;
}


// GET /auth/me — the only shape carrying isVerified, and the only one
// that uses `id` rather than `_id` (the route hand-builds it)
export interface CurrentUser {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    isVerified: boolean;
    avatar?: StoredFile;
}


// POST /auth/register and /auth/login.
// ⚠️ No isVerified: reading it here would be undefined, which is falsy,
// so follow a login with GET /auth/me before checking it.
export interface AuthUser {
    id: string;
    fullName: string;
    email: string;
    role: Role;
}
