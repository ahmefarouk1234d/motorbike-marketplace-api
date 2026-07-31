import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { verifiedGuard } from './core/guards/verified.guard';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'listings' },

    {
        path: 'listings',
        loadComponent: () => import('./features/listings/browse/browse').then(m => m.Browse)
    },
    {
        path: 'listings/create',
        loadComponent: () => import('./features/listings/create/create').then(m => m.Create),
        canActivate: [authGuard, roleGuard('seller', 'admin'), verifiedGuard]
    },
    {
        path: 'listings/:id',
        loadComponent: () => import('./features/listings/detail/detail').then(m => m.Detail)
    },

    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register').then(m => m.Register)
    },

    {
        path: 'favorites',
        loadComponent: () => import('./features/favorites/favorites').then(m => m.Favorites),
        canActivate: [authGuard]
    },
    {
        path: 'account',
        loadComponent: () => import('./features/account/profile/profile').then(m => m.Profile),
        canActivate: [authGuard]
    },
    {
        path: 'account/listings',
        loadComponent: () => import('./features/account/my-listings/my-listings').then(m => m.MyListings),
        canActivate: [authGuard]
    },
    {
        path: 'admin',
        loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard, roleGuard('admin')]
    },
    {
        path: 'admin/moderation',
        loadComponent: () => import('./features/admin/moderation/moderation').then(m => m.Moderation),
        canActivate: [authGuard, roleGuard('admin')]
    },
    {
        path: 'admin/brands',
        loadComponent: () => import('./features/admin/brands/brands').then(m => m.Brands),
        canActivate: [authGuard, roleGuard('admin')]
    },

    { path: '**', redirectTo: 'listings' }
];
