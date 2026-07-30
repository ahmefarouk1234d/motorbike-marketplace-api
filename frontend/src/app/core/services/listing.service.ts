import { HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
    CreateListingDto,
    Listing,
    ListingQuery,
    ListingStatusUpdate,
    UpdateListingDto
} from '../models/listing';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ListingService {
    private api = inject(ApiService);

    list(query: ListingQuery = {}): Observable<Listing[]> {
        return this.api.get<Listing[]>('listings', this.toParams(query));
    }

    getOne(id: string): Observable<Listing> {
        return this.api.get<Listing>(`listings/${id}`);
    }

    create(data: CreateListingDto, images: File[] = []): Observable<Listing> {
        return this.api.post<Listing>('listings', this.toFormData(data, images));
    }

    update(id: string, data: UpdateListingDto, images: File[] = []): Observable<Listing> {
        return this.api.patch<Listing>(`listings/${id}`, this.toFormData(data, images));
    }

    remove(id: string): Observable<Listing> {
        return this.api.delete<Listing>(`listings/${id}`);
    }

    setStatus(id: string, status: ListingStatusUpdate): Observable<Listing> {
        return this.api.patch<Listing>(`listings/${id}/status`, { status });
    }

    private toParams(query: ListingQuery): HttpParams {
        let params = new HttpParams();

        for (const [field, value] of Object.entries(query)) {
            if (value === undefined || value === null || value === '') continue;

            if (typeof value === 'object') {
                for (const [operator, bound] of Object.entries(value)) {
                    if (bound === undefined || bound === null) continue;
                    params = params.set(`${field}[${operator}]`, String(bound));
                }
                continue;
            }

            params = params.set(field, String(value));
        }

        return params;
    }

    private toFormData(data: Record<string, unknown>, images: File[]): FormData {
        const form = new FormData();

        for (const [key, value] of Object.entries(data)) {
            if (value === undefined || value === null || value === '') continue;
            form.append(key, String(value));
        }

        for (const image of images) {
            form.append('images', image);
        }

        return form;
    }
}
