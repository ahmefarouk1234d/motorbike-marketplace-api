import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './login.html'
})
export class Login {
    private readonly fb = inject(FormBuilder);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notify = inject(NotificationService);

    readonly pending = signal(false);
    readonly failed = signal<string | null>(null);

    readonly form = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
    });

    submit(): void {
        if (this.pending()) return;

        this.failed.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.pending.set(true);

        this.auth.login(this.form.getRawValue()).subscribe({
            next: user => {
                this.pending.set(false);
                this.notify.success(`Signed in as ${user.fullName}`);
                this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') ?? '/listings');
            },
            error: err => {
                this.pending.set(false);
                this.failed.set(err.error?.message ?? 'We could not sign you in. Please try again.');
            }
        });
    }
}
