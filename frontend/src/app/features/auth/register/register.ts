import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './register.html'
})
export class Register {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);

    readonly pending = signal(false);
    readonly failed = signal<string | null>(null);
    readonly registeredEmail = signal<string | null>(null);
    readonly resending = signal(false);
    readonly resent = signal(false);

    readonly form = this.fb.nonNullable.group({
        fullName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        phone: [''],
        city: ['']
    });

    submit(): void {
        if (this.pending()) return;

        this.failed.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.pending.set(true);
        const email = this.form.controls.email.value;

        this.auth.register(this.form.getRawValue()).subscribe({
            next: () => {
                this.pending.set(false);
                this.registeredEmail.set(email);
            },
            error: err => {
                this.pending.set(false);
                this.failed.set(err.error?.message ?? 'We could not create your account. Please try again.');
            }
        });
    }

    resend(): void {
        const email = this.registeredEmail();
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
