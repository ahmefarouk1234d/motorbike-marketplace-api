import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Brand } from '../../../core/models/brand';
import { Condition, Listing, ListingQuery } from '../../../core/models/listing';
import { AuthService } from '../../../core/services/auth.service';
import { BrandService } from '../../../core/services/brand.service';
import { FavoriteService } from '../../../core/services/favorite.service';
import { ListingService } from '../../../core/services/listing.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ListingCard } from '../../../shared/listing-card/listing-card';
import { Select, SelectOption } from '../../../shared/select/select';

interface Chip {
    key: string;
    label: string;
}

const PAGE_SIZE = 12;

@Component({
    selector: 'app-browse',
    imports: [FormsModule, ListingCard, Select],
    templateUrl: './browse.html'
})
export class Browse {
    private readonly listings = inject(ListingService);
    private readonly brandService = inject(BrandService);
    private readonly favorites = inject(FavoriteService);
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotificationService);

    readonly items = signal<Listing[]>([]);
    readonly brands = signal<Brand[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);
    readonly page = signal(1);

    readonly savedIds = signal<Set<string>>(new Set());
    readonly pendingFavorite = signal<string | null>(null);

    readonly city = signal('');
    readonly brand = signal('');
    readonly condition = signal<Condition | ''>('');
    readonly minPrice = signal<number | null>(null);
    readonly maxPrice = signal<number | null>(null);
    readonly sort = signal('-createdAt');

    readonly filtersOpen = signal(false);

    readonly isLoggedIn = this.auth.isLoggedIn;

    readonly cityOptions: SelectOption[] = [
        { value: '', label: 'Anywhere' },
        { value: 'Cairo', label: 'Cairo' },
        { value: 'Giza', label: 'Giza' },
        { value: 'Alexandria', label: 'Alexandria' },
        { value: 'Mansoura', label: 'Mansoura' },
        { value: 'Tanta', label: 'Tanta' }
    ];

    readonly sortOptions: SelectOption[] = [
        { value: '-createdAt', label: 'Newest first' },
        { value: 'price', label: 'Price: low to high' },
        { value: '-price', label: 'Price: high to low' },
        { value: '-viewsCount', label: 'Most viewed' }
    ];

    readonly brandOptions = computed<SelectOption[]>(() => [
        { value: '', label: 'Any brand' },
        ...this.brands().map(brand => ({ value: brand._id, label: brand.name }))
    ]);

    readonly hasNext = computed(() => this.items().length === PAGE_SIZE);
    readonly hasPrev = computed(() => this.page() > 1);

    readonly chips = computed<Chip[]>(() => {
        const chips: Chip[] = [];

        if (this.condition()) chips.push({ key: 'condition', label: this.condition() === 'new' ? 'New' : 'Used' });
        if (this.city()) chips.push({ key: 'city', label: this.city() });

        const brandId = this.brand();
        if (brandId) {
            const match = this.brands().find(item => item._id === brandId);
            chips.push({ key: 'brand', label: match?.name ?? 'Brand' });
        }

        const min = this.minPrice();
        const max = this.maxPrice();
        if (min !== null) chips.push({ key: 'minPrice', label: `From ${min.toLocaleString()} EGP` });
        if (max !== null) chips.push({ key: 'maxPrice', label: `Up to ${max.toLocaleString()} EGP` });

        return chips;
    });

    readonly hasFilters = computed(() => this.chips().length > 0);

    readonly skeletons = Array.from({ length: 6 });

    constructor() {
        this.brandService.list().subscribe({
            next: brands => this.brands.set(brands),
            error: () => this.brands.set([])
        });

        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.error.set(null);

        this.listings.list(this.buildQuery()).subscribe({
            next: items => {
                this.items.set(items);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('We could not load listings. Check the API is running, then try again.');
                this.loading.set(false);
            }
        });

        if (this.isLoggedIn()) this.loadFavorites();
    }

    setCondition(value: Condition | ''): void {
        this.condition.set(value);
        this.applyFilters();
    }

    applyFilters(): void {
        this.page.set(1);
        this.filtersOpen.set(false);
        this.load();
    }

    clearFilters(): void {
        this.city.set('');
        this.brand.set('');
        this.condition.set('');
        this.minPrice.set(null);
        this.maxPrice.set(null);
        this.applyFilters();
    }

    removeChip(key: string): void {
        switch (key) {
            case 'condition': this.condition.set(''); break;
            case 'city': this.city.set(''); break;
            case 'brand': this.brand.set(''); break;
            case 'minPrice': this.minPrice.set(null); break;
            case 'maxPrice': this.maxPrice.set(null); break;
        }

        this.applyFilters();
    }

    changePage(delta: number): void {
        this.page.update(current => Math.max(1, current + delta));
        this.load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    isSaved(id: string): boolean {
        return this.savedIds().has(id);
    }

    toggleFavorite(listing: Listing): void {
        if (!this.isLoggedIn()) {
            this.notify.info('Sign in to save bikes to your favourites.');
            return;
        }

        const id = listing._id;
        if (this.pendingFavorite()) return;
        this.pendingFavorite.set(id);

        const saved = this.isSaved(id);
        const request: Observable<unknown> = saved ? this.favorites.remove(id) : this.favorites.add(id);

        request.subscribe({
            next: () => {
                this.savedIds.update(ids => {
                    const next = new Set(ids);
                    if (saved) next.delete(id);
                    else next.add(id);
                    return next;
                });

                this.notify.success(saved ? `Removed ${listing.title}` : `Saved ${listing.title} to favourites`);
                this.pendingFavorite.set(null);
            },
            error: () => this.pendingFavorite.set(null)
        });
    }

    private loadFavorites(): void {
        this.favorites.list().subscribe({
            next: favorites => {
                const ids = favorites
                    .map(favorite => (typeof favorite.listing === 'string' ? favorite.listing : favorite.listing?._id))
                    .filter((id): id is string => Boolean(id));

                this.savedIds.set(new Set(ids));
            },
            error: () => this.savedIds.set(new Set())
        });
    }

    private buildQuery(): ListingQuery {
        const query: ListingQuery = { page: this.page(), limit: PAGE_SIZE, sort: this.sort() };

        if (this.city()) query.city = this.city();
        if (this.brand()) query.brand = this.brand();
        if (this.condition()) query.condition = this.condition() as Condition;

        const min = this.minPrice();
        const max = this.maxPrice();
        if (min !== null || max !== null) {
            query.price = {
                ...(min !== null ? { gte: min } : {}),
                ...(max !== null ? { lte: max } : {})
            };
        }

        return query;
    }
}
