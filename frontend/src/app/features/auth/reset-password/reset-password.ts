import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-reset-password',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './reset-password.html'
})
export class ResetPassword {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly notify = inject(NotificationService);

    readonly token = input('');

    readonly pending = signal(false);
    readonly failed = signal<string | null>(null);

    readonly form = this.fb.nonNullable.group({
        password: ['', [Validators.required, Validators.minLength(8)]]
    });

    submit(): void {
        if (this.pending()) return;

        this.failed.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.pending.set(true);

        this.auth.resetPassword(this.token(), this.form.controls.password.value).subscribe({
            next: user => {
                this.pending.set(false);
                this.notify.success(`Password changed. Signed in as ${user.fullName}.`);
                this.router.navigateByUrl('/listings');
            },
            error: err => {
                this.pending.set(false);
                this.failed.set(err.error?.message ?? 'That reset link is not valid.');
            }
        });
    }
}
