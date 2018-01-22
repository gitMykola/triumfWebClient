import { Component, OnInit } from '@angular/core';
import {TranslatorService} from '../translator';
import {MatTab} from '@angular/material';
import {NgbTabChangeEvent} from '@ng-bootstrap/ng-bootstrap';
import {AccountsService} from '../_services/accounts.service';
import { config } from '../config';
import {NgControl} from '@angular/forms';

@Component({
    selector: 'app-t-start',
    templateUrl: './start.component.html',
})
export class StartComponent implements OnInit {
    currencies: any;
    langs: any;
    selectedLang: string;
    just: string;
    selectedCurrency: string;
    eth: any;
    networks: {};
    accounts: any;
    addForm: any;
    constructor(
        public trans: TranslatorService,
        public aService: AccountsService) {
        this.currencies = config().currencies;
        this.langs = config().app.lang;
    }
    ngOnInit() {
        this.trans.set('EN');
        this.just = 'fill';
        this.selectedCurrency = 'ETH';
        this.accounts = this.aService.getAccounts();
        this.networks = {
            ETH: '',
            BTC: ''
        };
        this.currencies.forEach(e => {
            this.networks[e.symbol] = e.networks[0];
        });
        this.initAddForm();
    }
    sc($event: NgbTabChangeEvent) {
        this.selectedCurrency = $event.nextId;
        // this.networks = this.currencies.filter(e => { return e.symbol === this.selectedCurrency; })[0].networks;
    }
    setLang(lang: string) {
        console.dir(lang);
        this.trans.set(lang);
    }
    getAccounts(symbol: string, network: string): any {
        console.log(symbol + ' ' + network);
        if (symbol === 'all') { return this.aService.getAccounts();
        } else {
            return this.aService.getAccounts()
                .filter(el => el.symbol === symbol && el.network === network);
        }
    }
    addAccount(accSymbol: string, network: string) {
        this.addForm.enable = true;
        // console.log(accSymbol);
        // console.dir(this.getAccounts(accSymbol, network));
    }
    openAccount(accSymbol: string) {
        console.log(accSymbol);
    }
    selectNetwork(network: string, symbol: string) {
        this.networks[symbol] = network;
    }
    generateAccount(currency: string, network: string) {
        console.dir('');
    }
    initAddForm() {
        this.addForm = {};
        this.addForm.step = 1;
        this.addForm.new = false;
        this.addForm.enable = false;
        this.addForm.passphrase = '';
    }
}

