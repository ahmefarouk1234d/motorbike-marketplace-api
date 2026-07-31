import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Brand } from '../../../core/models/brand';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '../../../core/models/listing';
import { BrandService } from '../../../core/services/brand.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-brands',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './brands.html'
})
export class Brands {
    private readonly fb = inject(FormBuilder);
    private readonly brandService = inject(BrandService);
    private readonly notify = inject(NotificationService);

    readonly items = signal<Brand[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);
    readonly creating = signal(false);
    readonly confirming = signal<string | null>(null);
    readonly working = signal<string | null>(null);

    readonly logo = signal<File | null>(null);
    readonly logoPreview = signal<string | null>(null);

    readonly skeletons = Array.from({ length: 4 });

    readonly form = this.fb.nonNullable.group({
        name: ['', [Validators.required]],
        description: ['']
    });

    constructor() {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.error.set(null);

        this.brandService.list().subscribe({
            next: items => {
                this.items.set(items);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('We could not load the brands. Please try again.');
                this.loading.set(false);
            }
        });
    }

    onLogoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';

        if (!file) return;

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            this.notify.error('Choose a JPEG, PNG or WebP image.');
            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            this.notify.error('That logo is larger than 5 MB.');
            return;
        }

        const previous = this.logoPreview();
        if (previous) URL.revokeObjectURL(previous);

        this.logo.set(file);
        this.logoPreview.set(URL.createObjectURL(file));
    }

    clearLogo(): void {
        const previous = this.logoPreview();
        if (previous) URL.revokeObjectURL(previous);

        this.logo.set(null);
        this.logoPreview.set(null);
    }

    create(): void {
        if (this.creating()) return;

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const file = this.logo();
        if (!file) {
            this.notify.error('A logo is required to create a brand.');
            return;
        }

        this.creating.set(true);

        this.brandService.create(this.form.getRawValue(), file).subscribe({
            next: brand => {
                this.items.update(items => [...items, brand]);
                this.notify.success(`Added ${brand.name}`);
                this.form.reset({ name: '', description: '' });
                this.clearLogo();
                this.creating.set(false);
            },
            error: () => this.creating.set(false)
        });
    }

    remove(brand: Brand): void {
        if (this.working()) return;
        this.working.set(brand._id);

        this.brandService.remove(brand._id).subscribe({
            next: () => {
                this.items.update(items => items.filter(item => item._id !== brand._id));
                this.notify.success(`Deleted ${brand.name}`);
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
