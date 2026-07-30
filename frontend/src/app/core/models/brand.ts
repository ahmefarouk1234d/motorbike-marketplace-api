import { StoredFile } from './api';

// GET /brands returns every field. Populated on a listing it carries only
// _id, name and logo, which is why the rest are optional.
export interface Brand {
    _id: string;
    name: string;
    description?: string;
    logo?: StoredFile;
    createdAt?: string;
    updatedAt?: string;
}
