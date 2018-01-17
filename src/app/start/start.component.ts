import { Component, OnInit } from '@angular/core';
import {TranslatorService} from '../translator';
@Component({
    selector: 'app-t-start',
    templateUrl: './start.component.html',
})
export class StartComponent implements OnInit {
    constructor(public trans: TranslatorService) {}
    ngOnInit() {
        this.trans.set('EN');
    }
}

