import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isPopulated } from '../../../core/models/api';
import { Brand } from '../../../core/models/brand';
import {
    ACCEPTED_IMAGE_TYPES,
    Condition,
    CreateListingDto,
    Listing,
    MAX_IMAGE_BYTES,
    MAX_LISTING_IMAGES,
    UpdateListingDto
} from '../../../core/models/listing';
import { User } from '../../../core/models/user';
import { AuthService } from '../../../core/services/auth.service';
import { BrandService } from '../../../core/services/brand.service';
import { ListingService } from '../../../core/services/listing.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Select, SelectOption } from '../../../shared/select/select';

interface Preview {
    file: File;
    url: string;
}

@Component({
    selector: 'app-create',
    imports: [ReactiveFormsModule, Select],
    templateUrl: './create.html'
})
export class Create {
    private readonly fb = inject(FormBuilder);
    private readonly listings = inject(ListingService);
    private readonly brandService = inject(BrandService);
    private readonly notify = inject(NotificationService);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    // withComponentInputBinding sets this from the route. On /listings/create
    // there is no :id segment, so it arrives as undefined rather than falling
    // back to the declared default — hence the ?? below.
    readonly id = input<string | undefined>('');
    readonly listingId = computed(() => this.id() ?? '');

    readonly maxImages = MAX_LISTING_IMAGES;
    readonly maxBytes = MAX_IMAGE_BYTES;
    readonly currentYear = new Date().getFullYear();

    readonly isEdit = computed(() => this.listingId().length > 0);
    readonly loadingListing = signal(false);
    readonly existingImages = signal<number>(0);

    readonly pending = signal(false);
    readonly failed = signal<string | null>(null);
    readonly created = signal<string | null>(null);
    readonly saved = signal(false);
    readonly previews = signal<Preview[]>([]);
    readonly dragging = signal(false);

    readonly brandOptions = signal<SelectOption[]>([]);

    readonly cityOptions: SelectOption[] = [
        { value: 'Cairo', label: 'Cairo' },
        { value: 'Giza', label: 'Giza' },
        { value: 'Alexandria', label: 'Alexandria' },
        { value: 'Mansoura', label: 'Mansoura' },
        { value: 'Tanta', label: 'Tanta' }
    ];

    readonly canAddMore = computed(() => this.previews().length < this.maxImages);

    readonly form = this.fb.nonNullable.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        brand: ['', [Validators.required]],
        model: ['', [Validators.required]],
        year: [this.currentYear, [Validators.required, Validators.min(1900), Validators.max(this.currentYear)]],
        engineCC: [125, [Validators.required, Validators.min(0)]],
        condition: ['used' as Condition, [Validators.required]],
        price: [0, [Validators.required, Validators.min(0)]],
        mileage: [0, [Validators.required, Validators.min(0)]],
        city: ['', [Validators.required]],
        description: ['', [Validators.required, Validators.minLength(10)]]
    });

    constructor() {
        this.brandService.list().subscribe({
            next: brands => this.brandOptions.set(brands.map(brand => ({ value: brand._id, label: brand.name }))),
            error: () => this.brandOptions.set([])
        });

        effect(() => {
            const id = this.listingId();
            if (id) this.loadExisting(id);
        });
    }

    private loadExisting(id: string): void {
        this.loadingListing.set(true);

        this.listings.getOne(id).subscribe({
            next: listing => {
                if (!this.canEdit(listing)) {
                    this.notify.error('You can only edit your own listings.');
                    this.router.navigate(['/listings', id]);
                    return;
                }

                this.form.patchValue({
                    title: listing.title,
                    brand: isPopulated<Brand>(listing.brand) ? listing.brand._id : listing.brand,
                    model: listing.model,
                    year: listing.year,
                    engineCC: listing.engineCC,
                    condition: listing.condition,
                    price: listing.price,
                    mileage: listing.mileage,
                    city: listing.city,
                    description: listing.description
                });

                // The API ignores a brand sent in a PATCH body, so the control is
                // locked rather than left looking editable.
                this.form.controls.brand.disable();

                this.existingImages.set(listing.images?.length ?? 0);
                this.loadingListing.set(false);
            },
            error: () => {
                this.loadingListing.set(false);
                this.failed.set('We could not load this listing.');
            }
        });
    }

    private canEdit(listing: Listing): boolean {
        if (this.auth.isAdmin()) return true;

        const sellerId = isPopulated<User>(listing.seller) ? listing.seller._id : listing.seller;
        return sellerId === this.auth.user()?.id;
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.dragging.set(true);
    }

    onDragLeave(): void {
        this.dragging.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragging.set(false);
        this.addFiles(event.dataTransfer?.files ?? null);
    }

    onFileInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.addFiles(input.files);
        input.value = '';
    }

    addFiles(list: FileList | null): void {
        if (!list) return;

        for (const file of Array.from(list)) {
            if (!this.canAddMore()) {
                this.notify.error(`You can upload ${this.maxImages} photos at most.`);
                return;
            }

            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                this.notify.error(`${file.name} is not a JPEG, PNG or WebP.`);
                continue;
            }

            if (file.size > this.maxBytes) {
                this.notify.error(`${file.name} is larger than 5 MB.`);
                continue;
            }

            this.previews.update(current => [...current, { file, url: URL.createObjectURL(file) }]);
        }
    }

    removeImage(index: number): void {
        this.previews.update(current => {
            const preview = current[index];
            if (preview) URL.revokeObjectURL(preview.url);
            return current.filter((_, i) => i !== index);
        });
    }

    setCondition(value: Condition): void {
        this.form.controls.condition.setValue(value);
    }

    submit(): void {
        if (this.pending()) return;

        this.failed.set(null);

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.failed.set('Some details are missing. Check the highlighted fields.');
            return;
        }

        this.pending.set(true);

        const raw = this.form.getRawValue();
        const files = this.previews().map(preview => preview.file);

        if (this.isEdit()) {
            // brand is omitted deliberately: the API ignores it on update.
            const changes: UpdateListingDto = {
                title: raw.title,
                description: raw.description,
                price: Number(raw.price),
                model: raw.model,
                year: Number(raw.year),
                mileage: Number(raw.mileage),
                engineCC: Number(raw.engineCC),
                condition: raw.condition,
                city: raw.city
            };

            this.listings.update(this.listingId(), changes, files).subscribe({
                next: listing => {
                    this.previews().forEach(preview => URL.revokeObjectURL(preview.url));
                    this.pending.set(false);
                    this.saved.set(true);
                    this.created.set(listing._id);
                },
                error: err => {
                    this.pending.set(false);
                    this.failed.set(err.error?.message ?? 'We could not save your changes. Please try again.');
                }
            });

            return;
        }

        const dto: CreateListingDto = {
            title: raw.title,
            description: raw.description,
            price: Number(raw.price),
            brand: raw.brand,
            model: raw.model,
            year: Number(raw.year),
            mileage: Number(raw.mileage),
            engineCC: Number(raw.engineCC),
            condition: raw.condition,
            city: raw.city
        };

        this.listings.create(dto, files).subscribe({
            next: listing => {
                this.previews().forEach(preview => URL.revokeObjectURL(preview.url));
                this.pending.set(false);
                this.created.set(listing._id);
            },
            error: err => {
                this.pending.set(false);
                this.failed.set(err.error?.message ?? 'We could not publish your listing. Please try again.');
            }
        });
    }

    viewListing(): void {
        const id = this.created();
        if (id) this.router.navigate(['/listings', id]);
    }
}
