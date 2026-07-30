import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPopulated } from '../../core/models/api';
import { Brand } from '../../core/models/brand';
import { Listing } from '../../core/models/listing';

@Component({
    selector: 'app-listing-card',
    imports: [RouterLink, DecimalPipe],
    templateUrl: './listing-card.html'
})
export class ListingCard {
    readonly listing = input.required<Listing>();
    readonly favorite = input(false);

    readonly favoriteToggled = output<Listing>();

    readonly loaded = signal(false);

    readonly brandName = computed(() => {
        const brand = this.listing().brand;
        return isPopulated<Brand>(brand) ? brand.name : 'Bike';
    });

    readonly imageUrl = computed(() => this.listing().images?.[0]?.url ?? null);
    readonly imageCount = computed(() => this.listing().images?.length ?? 0);
    readonly isNew = computed(() => this.listing().condition === 'new');

    toggle(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        this.favoriteToggled.emit(this.listing());
    }
}
