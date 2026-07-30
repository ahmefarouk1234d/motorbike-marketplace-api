
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


// PATCH /auth/reset-password/:token — a token and no data at all
export interface TokenResponse {
    success: boolean;
    token: string;
}


// verify-email, resend-verification, forgot-password,
// DELETE /favorites/:listingId and /health — a message instead of data
export interface MessageResponse {
    success: boolean;
    message: string;
}


export interface ApiError {
    success: boolean;
    message: string;
}


// A reference the API populates on reads but returns as a bare id from
// POST, DELETE and PATCH /:id/status
export type Ref<T> = T | string;

// Narrows Ref<T> so templates can reach into it:
//   isPopulated(listing.brand) ? listing.brand.name : '—'
export const isPopulated = <T>(ref: Ref<T>): ref is T => typeof ref !== 'string';
