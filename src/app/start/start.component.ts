import { Component, OnInit } from '@angular/core';
import {TranslatorService} from '../translator';
import {MatTab} from '@angular/material';
import {NgbTabChangeEvent} from '@ng-bootstrap/ng-bootstrap';
import { EthComponent } from '../eth';

@Component({
    selector: 'app-t-start',
    templateUrl: './start.component.html',
})
export class StartComponent implements OnInit {
    just: string;
    selectedCurrency: string;
    constructor(public trans: TranslatorService) {}
    ngOnInit() {
        this.trans.set('EN');
        this.just = 'fill';
        this.selectedCurrency = 'eth';
    }
    sc($event: NgbTabChangeEvent) {
        this.selectedCurrency = $event.nextId;
    }
}

