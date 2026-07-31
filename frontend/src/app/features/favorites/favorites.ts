import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Favorite } from '../../core/models/favorite';
import { Listing } from '../../core/models/listing';
import { FavoriteService } from '../../core/services/favorite.service';
import { NotificationService } from '../../core/services/notification.service';
import { ListingCard } from '../../shared/listing-card/listing-card';

@Component({
    selector: 'app-favorites',
    imports: [RouterLink, ListingCard],
    templateUrl: './favorites.html'
})
export class Favorites {
    private readonly favorites = inject(FavoriteService);
    private readonly notify = inject(NotificationService);

    readonly items = signal<Favorite[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);
    readonly removing = signal<string | null>(null);

    readonly skeletons = Array.from({ length: 3 });

    readonly listings = computed(() =>
        this.items()
            .map(favorite => favorite.listing)
            .filter((listing): listing is Listing => Boolean(listing) && typeof listing !== 'string')
    );

    readonly orphaned = computed(() => this.items().filter(favorite => !favorite.listing).length);

    constructor() {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.error.set(null);

        this.favorites.list().subscribe({
            next: items => {
                this.items.set(items);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('We could not load your favourites. Please try again.');
                this.loading.set(false);
            }
        });
    }

    remove(listing: Listing): void {
        if (this.removing()) return;
        this.removing.set(listing._id);

        this.favorites.remove(listing._id).subscribe({
            next: () => {
                this.items.update(items =>
                    items.filter(favorite => {
                        const saved = favorite.listing;
                        const id = typeof saved === 'string' ? saved : saved?._id;
                        return id !== listing._id;
                    })
                );

                this.notify.success(`Removed ${listing.title}`);
                this.removing.set(null);
            },
            error: () => this.removing.set(null)
        });
    }
}
