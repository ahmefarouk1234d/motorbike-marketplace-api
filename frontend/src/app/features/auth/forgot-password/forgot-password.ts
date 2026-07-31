import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-forgot-password',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './forgot-password.html'
})
export class ForgotPassword {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);

    readonly pending = signal(false);
    readonly sent = signal(false);
    readonly failed = signal<string | null>(null);

    readonly form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]]
    });

    submit(): void {
        if (this.pending()) return;

        this.failed.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.pending.set(true);

        this.auth.forgotPassword(this.form.controls.email.value).subscribe({
            next: () => {
                this.pending.set(false);
                this.sent.set(true);
            },
            error: err => {
                this.pending.set(false);
                this.failed.set(err.error?.message ?? 'We could not send the link. Please try again.');
            }
        });
    }
}
