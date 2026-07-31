import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { isPopulated } from '../../../core/models/api';
import { Brand } from '../../../core/models/brand';
import { Listing, ListingStatusUpdate } from '../../../core/models/listing';
import { User } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { ListingService } from '../../../core/services/listing.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-detail',
    imports: [],
    templateUrl: './detail.html'
})
export class Detail {
    private readonly listings = inject(ListingService);
    private readonly favorites = inject(FavoriteService);
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotificationService);
    private readonly router = inject(Router);

    readonly id = input.required<string>();

    readonly listing = signal<Listing | null>(null);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);
    readonly notFound = signal(false);

    readonly activeImage = signal(0);
    readonly imageLoaded = signal(false);

    readonly saved = signal(false);
    readonly savingFavorite = signal(false);
    readonly confirmingDelete = signal(false);
    readonly working = signal(false);
    readonly showEmail = signal(false);

    readonly isLoggedIn = this.auth.isLoggedIn;
    readonly isAdmin = this.auth.isAdmin;

    readonly seller = computed<User | null>(() => {
        const value = this.listing()?.seller;
        if (!value) return null;
        return isPopulated<User>(value) ? value : null;
    });

    readonly brand = computed<Brand | null>(() => {
        const value = this.listing()?.brand;
        if (!value) return null;
        return isPopulated<Brand>(value) ? value : null;
    });

    readonly isOwner = computed(() => {
        const sellerId = this.seller()?._id;
        const userId = this.auth.user()?.id;
        return Boolean(sellerId && userId && sellerId === userId);
    });

    readonly images = computed(() => this.listing()?.images ?? []);
    readonly currentImage = computed(() => this.images()[this.activeImage()]?.url ?? null);

    readonly sellerInitials = computed(() => {
        const name = this.seller()?.fullName;
        if (!name) return '?';

        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase();
    });

    constructor() {
        effect(() => {
            const id = this.id();
            if (id) this.load(id);
        });
    }

    load(id: string): void {
        this.loading.set(true);
        this.error.set(null);
        this.notFound.set(false);

        this.listings.getOne(id).subscribe({
            next: listing => {
                this.listing.set(listing);
                this.activeImage.set(0);
                this.imageLoaded.set(false);
                this.loading.set(false);
                if (this.isLoggedIn()) this.checkSaved(id);
            },
            error: err => {
                if (err.status === 404) this.notFound.set(true);
                else this.error.set('We could not load this listing. Check the API is running, then try again.');
                this.loading.set(false);
            }
        });
    }

    selectImage(index: number): void {
        if (index === this.activeImage()) return;
        this.imageLoaded.set(false);
        this.activeImage.set(index);
    }

    toggleFavorite(): void {
        const listing = this.listing();
        if (!listing) return;

        if (!this.isLoggedIn()) {
            this.notify.info('Sign in to save bikes to your favourites.');
            return;
        }

        if (this.savingFavorite()) return;
        this.savingFavorite.set(true);

        const wasSaved = this.saved();
        const request: Observable<unknown> = wasSaved
            ? this.favorites.remove(listing._id)
            : this.favorites.add(listing._id);

        request.subscribe({
            next: () => {
                this.saved.set(!wasSaved);
                this.notify.success(wasSaved ? 'Removed from favourites' : 'Saved to favourites');
                this.savingFavorite.set(false);
            },
            error: () => this.savingFavorite.set(false)
        });
    }

    remove(): void {
        const listing = this.listing();
        if (!listing || this.working()) return;

        this.working.set(true);

        this.listings.remove(listing._id).subscribe({
            next: () => {
                this.notify.success('Listing deleted');
                this.router.navigateByUrl('/listings');
            },
            error: () => {
                this.working.set(false);
                this.confirmingDelete.set(false);
            }
        });
    }

    setStatus(status: ListingStatusUpdate): void {
        const listing = this.listing();
        if (!listing || this.working()) return;

        this.working.set(true);

        this.listings.setStatus(listing._id, status).subscribe({
            next: updated => {
                this.listing.update(current => (current ? { ...current, status: updated.status } : current));
                this.notify.success(status === 'approved' ? 'Listing approved' : 'Listing rejected');
                this.working.set(false);
            },
            error: () => this.working.set(false)
        });
    }

    private checkSaved(id: string): void {
        this.favorites.list().subscribe({
            next: favorites => {
                const ids = favorites.map(favorite =>
                    typeof favorite.listing === 'string' ? favorite.listing : favorite.listing?._id
                );

                this.saved.set(ids.includes(id));
            },
            error: () => this.saved.set(false)
        });
    }
}
