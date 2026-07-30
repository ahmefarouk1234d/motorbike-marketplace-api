import { Injectable, signal } from '@angular/core';

export type NoticeKind = 'error' | 'success' | 'info';

export interface Notice {
    id: number;
    kind: NoticeKind;
    text: string;
}

const DISMISS_AFTER_MS = 6000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private _notices = signal<Notice[]>([]);
    private nextId = 0;

    readonly notices = this._notices.asReadonly();

    error(text: string): void {
        this.push('error', text);
    }

    success(text: string): void {
        this.push('success', text);
    }

    info(text: string): void {
        this.push('info', text);
    }

    dismiss(id: number): void {
        this._notices.update(notices => notices.filter(notice => notice.id !== id));
    }

    private push(kind: NoticeKind, text: string): void {
        const id = this.nextId++;
        this._notices.update(notices => [...notices, { id, kind, text }]);
        setTimeout(() => this.dismiss(id), DISMISS_AFTER_MS);
    }
}
