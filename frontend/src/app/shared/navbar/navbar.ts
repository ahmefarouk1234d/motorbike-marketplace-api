import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './navbar.html'
})
export class Navbar {
    private readonly auth = inject(AuthService);

    readonly user = this.auth.user;
    readonly isLoggedIn = this.auth.isLoggedIn;
    readonly isAdmin = this.auth.isAdmin;
    readonly canSell = this.auth.canSell;

    readonly menuOpen = signal(false);
    readonly accountOpen = signal(false);

    initials(name: string | undefined): string {
        if (!name) return '?';

        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase();
    }

    toggleMenu(): void {
        this.menuOpen.update(open => !open);
        this.accountOpen.set(false);
    }

    toggleAccount(): void {
        this.accountOpen.update(open => !open);
    }

    closeAll(): void {
        this.menuOpen.set(false);
        this.accountOpen.set(false);
    }

    logout(): void {
        this.closeAll();
        this.auth.logout();
    }
}
