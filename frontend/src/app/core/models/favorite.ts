import { Ref } from './api';
import { Listing } from './listing';

export interface Favorite {
    _id: string;
    user: string;
    listing: Ref<Listing> | null;
    createdAt?: string;
    updatedAt?: string;
}
