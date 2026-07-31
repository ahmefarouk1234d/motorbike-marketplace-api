import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPopulated } from '../../../core/models/api';
import { Brand } from '../../../core/models/brand';
import { Listing } from '../../../core/models/listing';
import { AuthService } from '../../../core/services/auth.service';
import { ListingService } from '../../../core/services/listing.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-my-listings',
    imports: [RouterLink],
    templateUrl: './my-listings.html'
})
export class MyListings {
    private readonly listings = inject(ListingService);
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotificationService);

    readonly items = signal<Listing[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);
    readonly confirming = signal<string | null>(null);
    readonly working = signal<string | null>(null);

    readonly skeletons = Array.from({ length: 3 });

    readonly counts = computed(() => {
        const items = this.items();
        return {
            approved: items.filter(item => item.status === 'approved').length,
            pending: items.filter(item => item.status === 'pending').length,
            rejected: items.filter(item => item.status === 'rejected').length
        };
    });

    constructor() {
        this.load();
    }

    load(): void {
        const sellerId = this.auth.user()?.id;
        if (!sellerId) {
            this.error.set('We could not identify your account. Try signing in again.');
            this.loading.set(false);
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        this.listings.list({ seller: sellerId, limit: 50 }).subscribe({
            next: items => {
                this.items.set(items);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('We could not load your listings. Please try again.');
                this.loading.set(false);
            }
        });
    }

    brandName(listing: Listing): string {
        return isPopulated<Brand>(listing.brand) ? listing.brand.name : '—';
    }

    imageUrl(listing: Listing): string | null {
        return listing.images?.[0]?.url ?? null;
    }

    remove(listing: Listing): void {
        if (this.working()) return;
        this.working.set(listing._id);

        this.listings.remove(listing._id).subscribe({
            next: () => {
                this.items.update(items => items.filter(item => item._id !== listing._id));
                this.notify.success(`Deleted ${listing.title}`);
                this.working.set(null);
                this.confirming.set(null);
            },
            error: () => {
                this.working.set(null);
                this.confirming.set(null);
            }
        });
    }
}
