import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Stats } from '../models/stats';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StatsService {
    private api = inject(ApiService);

    get(): Observable<Stats> {
        return this.api.get<Stats>('stats');
    }
}
