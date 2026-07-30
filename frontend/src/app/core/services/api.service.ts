import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    get<T>(endpoint: string, params?: HttpParams): Observable<T> {
        return this.http
            .get<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, { params })
            .pipe(map(res => res.data));
    }

    post<T>(endpoint: string, body?: unknown): Observable<T> {
        return this.http
            .post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body)
            .pipe(map(res => res.data));
    }

    patch<T>(endpoint: string, body?: unknown): Observable<T> {
        return this.http
            .patch<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, body)
            .pipe(map(res => res.data));
    }

    delete<T>(endpoint: string): Observable<T> {
        return this.http
            .delete<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`)
            .pipe(map(res => res.data));
    }

    getRaw<R>(endpoint: string, params?: HttpParams): Observable<R> {
        return this.http.get<R>(`${this.baseUrl}/${endpoint}`, { params });
    }

    postRaw<R>(endpoint: string, body?: unknown): Observable<R> {
        return this.http.post<R>(`${this.baseUrl}/${endpoint}`, body);
    }

    patchRaw<R>(endpoint: string, body?: unknown): Observable<R> {
        return this.http.patch<R>(`${this.baseUrl}/${endpoint}`, body);
    }

    deleteRaw<R>(endpoint: string): Observable<R> {
        return this.http.delete<R>(`${this.baseUrl}/${endpoint}`);
    }
}
