import { StoredFile } from './api';

export type Role = "admin" | "buyer" | "seller";

// admin is deliberately absent: the API only lets an account claim these two.
export type SignupRole = "buyer" | "seller";

export interface User {
    _id: string;
    fullName: string;
    email: string;
}

export interface CurrentUser {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    isVerified: boolean;
    avatar?: StoredFile;
}

export interface AuthUser {
    id: string;
    fullName: string;
    email: string;
    role: Role;
}

export interface RegisterDto {
    fullName: string;
    email: string;
    password: string;
    role?: SignupRole;
    phone?: string;
    city?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}
