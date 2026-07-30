import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Brand, CreateBrandDto, UpdateBrandDto } from '../models/brand';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BrandService {
    private api = inject(ApiService);

    list(): Observable<Brand[]> {
        return this.api.get<Brand[]>('brands');
    }

    getOne(id: string): Observable<Brand> {
        return this.api.get<Brand>(`brands/${id}`);
    }

    create(data: CreateBrandDto, logo: File): Observable<Brand> {
        return this.api.post<Brand>('brands', this.toFormData(data, logo));
    }

    update(id: string, data: UpdateBrandDto, logo?: File): Observable<Brand> {
        return this.api.patch<Brand>(`brands/${id}`, this.toFormData(data, logo));
    }

    remove(id: string): Observable<Brand> {
        return this.api.delete<Brand>(`brands/${id}`);
    }

    private toFormData(data: object, logo?: File): FormData {
        const form = new FormData();

        for (const [key, value] of Object.entries(data)) {
            if (value === undefined || value === null || value === '') continue;
            form.append(key, String(value));
        }

        if (logo) form.append('logo', logo);

        return form;
    }
}
