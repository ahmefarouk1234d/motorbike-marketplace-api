import { Ref, StoredFile } from './api';
import { User } from './user';
import { Brand } from './brand';

export type ListingStatus = "approved" | "rejected" | "sold" | "pending";
export type Condition = "new" | "used";

export interface Listing {
    _id: string;
    title: string;
    description: string;
    price: number;
    model: string;
    year: number;
    mileage: number;
    engineCC: number;
    condition: Condition;
    city: string;
    status: ListingStatus;
    viewsCount: number;

    images: StoredFile[];

    brand: Ref<Brand>;
    seller: Ref<User>;

    createdAt?: string;
    updatedAt?: string;
}

export interface RangeFilter {
    gte?: number;
    gt?: number;
    lte?: number;
    lt?: number;
}

export interface ListingQuery {
    brand?: string;
    model?: string;
    city?: string;
    condition?: Condition;
    status?: ListingStatus;
    seller?: string;
    price?: number | RangeFilter;
    year?: number | RangeFilter;
    mileage?: number | RangeFilter;
    engineCC?: number | RangeFilter;
    sort?: string;
    fields?: string;
    page?: number;
    limit?: number;
}

export interface CreateListingDto {
    title: string;
    description: string;
    price: number;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    engineCC: number;
    condition: Condition;
    city: string;
}

export type UpdateListingDto = Partial<Omit<CreateListingDto, 'brand'>>;

export type ListingStatusUpdate = 'approved' | 'rejected';

export const MAX_LISTING_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
