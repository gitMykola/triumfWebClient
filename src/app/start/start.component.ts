import { Component, OnInit } from '@angular/core';
import { config } from '../config';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslatorService} from '../translator';
import {AccountsService} from '../_services/accounts.service';
import {NgbTabChangeEvent} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-t-start',
    templateUrl: './start.component.html'
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
    aForm: any;
    wait: boolean;
    public addForm: FormGroup;
    constructor(
        public trans: TranslatorService,
        public aService: AccountsService,
        private fBuilder: FormBuilder) {
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
            BTC: '',
            LTC: ''
        };
        this.currencies.forEach(e => {
            this.networks[e.symbol] = e.networks[0];
        });
        this.addForm = this.fBuilder.group({
            new: false,
            passphrase: ['', [Validators.required, Validators.minLength(8),
                Validators.maxLength(256)]],
            cpass: ['', [Validators.required, Validators.minLength(8),
                Validators.maxLength(256)]],
            keyfile: ['', [Validators.required]],
        });
        this.initAForm();
        this.wait = false;
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
        this.aForm.enable = true;
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
    initAForm() {
    const self = this;
    self.aForm = {};
    self.aForm.step = 1;
    self.aForm.enable = false;
    self.aForm.next = true;
    self.aForm.validation = function(): boolean {
        console.log('Next' + self.aForm.step);
        switch (self.aForm.step) {
            case 1:
                self.aForm.error = null;
                self.aForm.next = true;
                return true;
            case 2:
                console.log('1' + self.aForm.next);
                if (self.addForm.get('passphrase').status === 'INVALID') {
                    self.aForm.error = self.trans.translate('err.passphrase_length');
                    self.aForm.next = false;
                    console.log('2' + self.aForm.next);
                    return false;
                } else if (self.addForm.get('new').value
                    && self.addForm.get('passphrase').value !== self.addForm.get('cpass').value) {
                    self.aForm.error = self.trans.translate('err.passphrase_cpass');
                    self.aForm.next = false;
                    console.log('3' + self.aForm.next);
                    return false;
                } else {
                    self.aForm.error = null;
                    self.aForm.next = true;
                    console.log('4' + self.aForm.next);
                    return true;
                }
            case 3:
                console.log('5' + self.aForm.next);
                if (!self.addForm.get('new').value &&
                    self.addForm.get('keyfile').status !== 'INVALID') {
                    console.dir(self.addForm.get('keyfile'));
                }
            default:
                return false;
        }
    };
    self.aForm.makeStep = function(e) {
        if (e.name === 'next') {
            self.aForm.step = self.aForm.step < 3 ? self.aForm.step + 1 : 3;
        } else {
            self.aForm.step = self.aForm.step > 1 ? self.aForm.step - 1 : 1;
        }
        self.aForm.validation();
         // 20400074498630 4-e
        console.log(self.aForm.step);
        console.log(self.addForm.get('passphrase').value);
        console.log(self.addForm.get('cpass').value);
        console.log(self.addForm.get('new').value);
        console.dir(self.addForm.get('keyfile'));
        console.dir(self.aForm.next);
        if (self.aForm.step === 3) {
            self.aForm.next = false;
            if (self.addForm.get('new').value) {
                console.log('Generate Account');
                self.aForm.createAccount();
            }
        }
    };
    self.aForm.open = function(files) {
        self.wait = true;
        const params = {
            passphrase: self.addForm.get('passphrase').value,
            symbol: self.selectedCurrency,
            network: self.networks[self.selectedCurrency],
            keyFile: files.target.files[0]
        };
        console.log('Open Account');
        console.dir(params);
        self.aService.openAccount(params, account => {
            self.wait = false;
            console.dir(account);
            console.log('Account response');
            self.aForm.close();
        });
        };
    self.aForm.createAccount = function() {
        self.wait = true;
        const params = {
            passphrase: self.addForm.get('passphrase').value,
            symbol: self.selectedCurrency,
            network: self.networks[self.selectedCurrency]
        };
        console.log('Generate');
        console.dir(params);
        self.aService.createAccount(params, response => {
            self.wait = false;
            console.dir(response);
            self.aForm.close();
        });
    };
    self.aForm.close = function() {
        self.initAForm();
        self.addForm.reset();
    };
}
}
