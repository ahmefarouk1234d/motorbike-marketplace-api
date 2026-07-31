import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-verify-email',
    imports: [RouterLink],
    templateUrl: './verify-email.html'
})
export class VerifyEmail {
    private readonly auth = inject(AuthService);

    readonly token = input('');

    readonly checking = signal(true);
    readonly verified = signal(false);
    readonly failed = signal<string | null>(null);

    readonly email = signal('');
    readonly resending = signal(false);
    readonly resent = signal(false);

    readonly isLoggedIn = this.auth.isLoggedIn;

    constructor() {
        effect(() => {
            const token = this.token();
            if (token) this.verify(token);
        });
    }

    private verify(token: string): void {
        this.checking.set(true);
        this.failed.set(null);

        this.auth.verifyEmail(token).subscribe({
            next: () => {
                this.verified.set(true);
                this.checking.set(false);

                // Refresh the session so isVerified flips without a sign-out.
                if (this.isLoggedIn()) this.auth.loadMe().subscribe({ error: () => {} });
            },
            error: err => {
                this.failed.set(err.error?.message ?? 'That link is not valid.');
                this.checking.set(false);
                this.email.set(this.auth.user()?.email ?? '');
            }
        });
    }

    resend(): void {
        const email = this.email().trim();
        if (!email || this.resending()) return;

        this.resending.set(true);

        this.auth.resendVerification(email).subscribe({
            next: () => {
                this.resending.set(false);
                this.resent.set(true);
            },
            error: () => this.resending.set(false)
        });
    }
}
