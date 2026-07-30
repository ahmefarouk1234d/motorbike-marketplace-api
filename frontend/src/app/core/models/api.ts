export interface StoredFile {
    url: string;
    path: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    results?: number;
}

export interface AuthResponse<T> {
    success: boolean;
    token: string;
    data: T;
}

export interface TokenResponse {
    success: boolean;
    token: string;
}

export interface MessageResponse {
    success: boolean;
    message: string;
}

export interface ApiError {
    success: boolean;
    message: string;
}

export type Ref<T> = T | string;

export const isPopulated = <T>(ref: Ref<T>): ref is T => typeof ref !== 'string';
