import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const verifiedGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const notify = inject(NotificationService);

    if (auth.isVerified()) {
        return true;
    }

    notify.error('Please verify your email before publishing a listing');
    return router.createUrlTree(['/listings']);
};
