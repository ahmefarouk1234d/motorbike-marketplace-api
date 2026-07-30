import { StoredFile } from './api';

export interface Brand {
    _id: string;
    name: string;
    description?: string;
    logo?: StoredFile;
    createdAt?: string;
    updatedAt?: string;
}
