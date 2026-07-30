import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Role } from '../models/user';

export const roleGuard = (...roles: Role[]): CanActivateFn => {
    return (_route, state) => {
        const auth = inject(AuthService);
        const router = inject(Router);
        const notify = inject(NotificationService);

        if (!auth.isLoggedIn()) {
            return router.createUrlTree(['/login'], {
                queryParams: { returnUrl: state.url }
            });
        }

        const userRole = auth.role();
        if (userRole && roles.includes(userRole)) {
            return true;
        }

        notify.error('You do not have access to that page');
        return router.createUrlTree(['/listings']);
    };
};
