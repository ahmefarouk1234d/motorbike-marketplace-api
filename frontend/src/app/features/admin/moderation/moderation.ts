import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPopulated } from '../../../core/models/api';
import { Brand } from '../../../core/models/brand';
import { Listing, ListingStatus, ListingStatusUpdate } from '../../../core/models/listing';
import { User } from '../../../core/models/user';
import { ListingService } from '../../../core/services/listing.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-moderation',
    imports: [RouterLink],
    templateUrl: './moderation.html'
})
export class Moderation {
    private readonly listings = inject(ListingService);
    private readonly notify = inject(NotificationService);

    readonly items = signal<Listing[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);
    readonly working = signal<string | null>(null);
    readonly filter = signal<ListingStatus>('pending');

    readonly skeletons = Array.from({ length: 4 });

    readonly filters: { value: ListingStatus; label: string }[] = [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
    ];

    constructor() {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.error.set(null);

        this.listings.list({ status: this.filter(), limit: 50 }).subscribe({
            next: items => {
                this.items.set(items);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('We could not load the queue. Please try again.');
                this.loading.set(false);
            }
        });
    }

    setFilter(status: ListingStatus): void {
        if (this.filter() === status) return;
        this.filter.set(status);
        this.load();
    }

    decide(listing: Listing, status: ListingStatusUpdate): void {
        if (this.working()) return;
        this.working.set(listing._id);

        this.listings.setStatus(listing._id, status).subscribe({
            next: () => {
                this.items.update(items => items.filter(item => item._id !== listing._id));
                this.notify.success(`${status === 'approved' ? 'Approved' : 'Rejected'} ${listing.title}`);
                this.working.set(null);
            },
            error: () => this.working.set(null)
        });
    }

    brandName(listing: Listing): string {
        return isPopulated<Brand>(listing.brand) ? listing.brand.name : '—';
    }

    sellerName(listing: Listing): string {
        return isPopulated<User>(listing.seller) ? listing.seller.fullName : 'Unknown seller';
    }

    imageUrl(listing: Listing): string | null {
        return listing.images?.[0]?.url ?? null;
    }
}
