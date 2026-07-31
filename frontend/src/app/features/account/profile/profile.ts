import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../../../core/models/listing';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-profile',
    imports: [RouterLink],
    templateUrl: './profile.html'
})
export class Profile {
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotificationService);

    readonly user = this.auth.user;
    readonly isVerified = this.auth.isVerified;
    readonly canSell = this.auth.canSell;

    readonly uploading = signal(false);
    readonly resending = signal(false);
    readonly resent = signal(false);

    readonly initials = computed(() => {
        const name = this.user()?.fullName;
        if (!name) return '?';

        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase();
    });

    onAvatarSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';

        if (!file) return;

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            this.notify.error('Choose a JPEG, PNG or WebP image.');
            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            this.notify.error('That image is larger than 5 MB.');
            return;
        }

        this.uploading.set(true);

        this.auth.updateAvatar(file).subscribe({
            next: () => {
                this.uploading.set(false);
                this.notify.success('Photo updated');
            },
            error: () => this.uploading.set(false)
        });
    }

    resendVerification(): void {
        const email = this.user()?.email;
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

    signOut(): void {
        this.auth.logout();
    }
}
