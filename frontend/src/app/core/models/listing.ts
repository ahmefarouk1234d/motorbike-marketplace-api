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
