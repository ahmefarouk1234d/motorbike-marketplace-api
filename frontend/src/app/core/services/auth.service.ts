import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthResponse, MessageResponse, StoredFile, TokenResponse } from '../models/api';
import { AuthUser, CurrentUser, LoginDto, RegisterDto } from '../models/user';
import { ApiService } from './api.service';

const TOKEN_KEY = 'mm_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private api = inject(ApiService);
    private router = inject(Router);

    private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
    private _user = signal<CurrentUser | null>(null);

    readonly token = this._token.asReadonly();
    readonly user = this._user.asReadonly();

    readonly isLoggedIn = computed(() => this._token() !== null);
    readonly role = computed(() => this._user()?.role ?? null);
    readonly isAdmin = computed(() => this.role() === 'admin');
    readonly isVerified = computed(() => this._user()?.isVerified ?? false);
    readonly canSell = computed(() => this.role() === 'seller' || this.role() === 'admin');
    readonly canPublish = computed(() => this.canSell() && this.isVerified());

    restore(): Observable<unknown> {
        if (!this._token()) return of(null);

        return this.loadMe().pipe(
            catchError(() => {
                this.clearSession();
                return of(null);
            })
        );
    }

    register(data: RegisterDto): Observable<CurrentUser> {
        return this.api.postRaw<AuthResponse<AuthUser>>('auth/register', data).pipe(
            tap(res => this.setToken(res.token)),
            switchMap(() => this.loadMe())
        );
    }

    login(data: LoginDto): Observable<CurrentUser> {
        return this.api.postRaw<AuthResponse<AuthUser>>('auth/login', data).pipe(
            tap(res => this.setToken(res.token)),
            switchMap(() => this.loadMe())
        );
    }

    loadMe(): Observable<CurrentUser> {
        return this.api.get<CurrentUser>('auth/me').pipe(tap(user => this._user.set(user)));
    }

    updateAvatar(avatar: File): Observable<CurrentUser | null> {
        const form = new FormData();
        form.append('avatar', avatar);

        return this.api.patch<{ avatar?: StoredFile }>('auth/me/avatar', form).pipe(
            map(result => {
                const current = this._user();
                if (!current) return null;

                const updated = { ...current, avatar: result.avatar };
                this._user.set(updated);
                return updated;
            })
        );
    }

    verifyEmail(token: string): Observable<string> {
        return this.api
            .getRaw<MessageResponse>(`auth/verify-email/${token}`)
            .pipe(map(res => res.message));
    }

    resendVerification(email: string): Observable<string> {
        return this.api
            .postRaw<MessageResponse>('auth/resend-verification', { email })
            .pipe(map(res => res.message));
    }

    forgotPassword(email: string): Observable<string> {
        return this.api
            .postRaw<MessageResponse>('auth/forgot-password', { email })
            .pipe(map(res => res.message));
    }

    resetPassword(token: string, password: string): Observable<CurrentUser> {
        return this.api.patchRaw<TokenResponse>(`auth/reset-password/${token}`, { password }).pipe(
            tap(res => this.setToken(res.token)),
            switchMap(() => this.loadMe())
        );
    }

    logout(redirectTo = '/login'): void {
        this.clearSession();
        this.router.navigateByUrl(redirectTo);
    }

    private setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
        this._token.set(token);
    }

    private clearSession(): void {
        localStorage.removeItem(TOKEN_KEY);
        this._token.set(null);
        this._user.set(null);
    }
}
