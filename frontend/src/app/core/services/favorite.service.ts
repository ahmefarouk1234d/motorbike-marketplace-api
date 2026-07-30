import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MessageResponse } from '../models/api';
import { Favorite } from '../models/favorite';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
    private api = inject(ApiService);

    list(): Observable<Favorite[]> {
        return this.api.get<Favorite[]>('favorites');
    }

    add(listingId: string): Observable<Favorite> {
        return this.api.post<Favorite>(`favorites/${listingId}`);
    }

    remove(listingId: string): Observable<string> {
        return this.api
            .deleteRaw<MessageResponse>(`favorites/${listingId}`)
            .pipe(map(res => res.message));
    }
}
