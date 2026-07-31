import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-coming-soon',
    imports: [RouterLink],
    templateUrl: './coming-soon.html'
})
export class ComingSoon {
    readonly title = input('This page');
}
