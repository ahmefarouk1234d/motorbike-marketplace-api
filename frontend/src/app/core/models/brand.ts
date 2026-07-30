import { StoredFile } from './api';

export interface Brand {
    _id: string;
    name: string;
    description?: string;
    logo?: StoredFile;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateBrandDto {
    name: string;
    description?: string;
}

export type UpdateBrandDto = Partial<CreateBrandDto>;
