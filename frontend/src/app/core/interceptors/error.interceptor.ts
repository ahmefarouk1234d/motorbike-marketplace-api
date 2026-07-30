import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiError } from '../models/api';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
    const notify = inject(NotificationService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const body = error.error as ApiError | null;
            const message = body?.message ?? 'Something went wrong';

            switch (error.status) {
                case 0:
                    notify.error('Cannot reach the API. Is the server running on port 5000?');
                    break;

                case 401:
                    if (auth.isLoggedIn()) {
                        notify.error('Your session has expired. Please sign in again.');
                        auth.logout();
                    }
                    break;

                case 403:
                case 429:
                    notify.error(message);
                    break;
            }

            return throwError(() => error);
        })
    );
};
