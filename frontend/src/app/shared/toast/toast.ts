import { Component, inject } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
    selector: 'app-toast',
    imports: [],
    templateUrl: './toast.html'
})
export class Toast {
    private readonly notifications = inject(NotificationService);

    readonly notices = this.notifications.notices;

    dismiss(id: number): void {
        this.notifications.dismiss(id);
    }
}
