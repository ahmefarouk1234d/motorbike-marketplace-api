import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Stats } from '../../../core/models/stats';
import { StatsService } from '../../../core/services/stats.service';

@Component({
    selector: 'app-dashboard',
    imports: [RouterLink, DecimalPipe],
    templateUrl: './dashboard.html'
})
export class Dashboard {
    private readonly stats = inject(StatsService);

    readonly data = signal<Stats | null>(null);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    readonly skeletons = Array.from({ length: 4 });

    readonly overview = computed(() => this.data()?.overview ?? {});
    readonly byCity = computed(() => this.data()?.byCity ?? []);
    readonly byBrand = computed(() => this.data()?.byBrand ?? []);

    readonly isEmpty = computed(() => !this.overview().totalListings);

    readonly maxCityCount = computed(() =>
        this.byCity().reduce((max, city) => Math.max(max, city.count), 0)
    );

    readonly maxBrandCount = computed(() =>
        this.byBrand().reduce((max, brand) => Math.max(max, brand.count), 0)
    );

    constructor() {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.error.set(null);

        this.stats.get().subscribe({
            next: data => {
                this.data.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('We could not load the statistics. Please try again.');
                this.loading.set(false);
            }
        });
    }

    barWidth(count: number, max: number): string {
        if (!max) return '0%';
        return `${Math.round((count / max) * 100)}%`;
    }
}
