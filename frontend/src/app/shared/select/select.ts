import { Component, ElementRef, computed, inject, input, output, signal } from '@angular/core';

export interface SelectOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-select',
    imports: [],
    templateUrl: './select.html',
    host: {
        class: 'relative block',
        '(document:click)': 'onDocumentClick($event)',
        '(keydown.escape)': 'close()'
    }
})
export class Select {
    private readonly host = inject(ElementRef<HTMLElement>);

    readonly options = input.required<SelectOption[]>();
    readonly value = input('');
    readonly placeholder = input('Select');
    readonly label = input('');

    readonly valueChange = output<string>();

    readonly open = signal(false);
    readonly activeIndex = signal(0);

    readonly selected = computed(() => this.options().find(option => option.value === this.value()));
    readonly display = computed(() => this.selected()?.label ?? this.placeholder());

    toggle(): void {
        if (this.open()) {
            this.close();
            return;
        }

        const index = this.options().findIndex(option => option.value === this.value());
        this.activeIndex.set(index < 0 ? 0 : index);
        this.open.set(true);
    }

    close(): void {
        this.open.set(false);
    }

    choose(option: SelectOption): void {
        this.valueChange.emit(option.value);
        this.close();
    }

    move(step: number): void {
        if (!this.open()) {
            this.toggle();
            return;
        }

        const count = this.options().length;
        if (!count) return;

        this.activeIndex.update(current => (current + step + count) % count);
    }

    chooseActive(): void {
        if (!this.open()) {
            this.toggle();
            return;
        }

        const option = this.options()[this.activeIndex()];
        if (option) this.choose(option);
    }

    onDocumentClick(event: Event): void {
        if (!this.open()) return;
        if (!this.host.nativeElement.contains(event.target as Node)) this.close();
    }
}
