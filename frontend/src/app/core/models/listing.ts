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

    images: StoredFile[];                    // array of StoredFile

    // ⚠️ QUIRK: populated (object) on GET, plain id (string) on POST/DELETE/PATCH-status
    brand: Ref<Brand>;                       // string OR Brand
    seller: Ref<User>;                       // string OR User

    createdAt?: string;
    updatedAt?: string;
}
