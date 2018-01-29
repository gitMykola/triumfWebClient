import { Component, OnInit } from '@angular/core';
import { config } from '../config';
import { FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslatorService} from '../translator';
import {AccountsService} from '../_services/accounts.service';
import {NgbTabChangeEvent} from '@ng-bootstrap/ng-bootstrap';
import * as asy from 'async';

@Component({
    selector: 'app-t-start',
    templateUrl: './start.component.html',
    styleUrls: ['../app.component.css']
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
        this.accounts = [];
        this.currencies.forEach(
            el => this.accounts[el.symbol] = []
        );
        this.networks = {
            ETH: this.currencies.filter(e => e.symbol === 'ETH')[0].networks[0],
            BTC: this.currencies.filter(e => e.symbol === 'BTC')[0].networks[0],
            LTC: this.currencies.filter(e => e.symbol === 'LTC')[0].networks[0],
            BTG: this.currencies.filter(e => e.symbol === 'BTG')[0].networks[0],
            BCH: this.currencies.filter(e => e.symbol === 'BCH')[0].networks[0]
        };
        this.currencies.forEach(e => {
            this.networks[e.symbol] = e.networks[0];
        });
        this.addForm = this.fBuilder.group({
            new: false,
            passphrase: ['', [Validators.required, Validators.minLength(6),
                Validators.maxLength(256)]],
            cpass: ['', [Validators.required, Validators.minLength(8),
                Validators.maxLength(256)]],
            keyfile: ['', [Validators.required]],
            advanced: false,
            ammount: ['', [Validators.required, Validators.min(0),
                Validators.max(1e18)]],
            gas: ['', [Validators.required, Validators.min(0),
                Validators.max(1e18)]],
            receiver: ['', [Validators.required, Validators.minLength(8),
                Validators.maxLength(256)]],
        });
        this.initAForm();
        this.wait = false;
        this.tabInit();
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
    get(account: any) {
        // e.preventDefault();
        this.aService.getAccountTransactions(account, txs => {
            console.dir(txs);
            console.dir(account);
            this.aService.getAccountBalance(account, bs => {
                console.log('Balance');
                console.dir(bs);
            });
        });
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
        self.wait = false;
        self.aForm = {};
        self.aForm.step = 1;
        self.aForm.enable = false;
        self.aForm.back = false;
        self.aForm.next = true;
        self.aForm.advanced = false;
        self.aForm.sender = null;
        self.aForm.rawTx = '';
        self.aForm.txHash = '';
        self.aForm.validation = function (): boolean {
            console.log('Next' + self.aForm.step);
            switch (self.aForm.step) {
                case 1:
                    self.aForm.error = null;
                    self.aForm.next = true;
                    return true;
                case 2:
                    console.log('Next step ' + self.aForm.next);
                    if (self.addForm.get('passphrase').status === 'INVALID') {
                        self.aForm.error = self.trans.translate('err.passphrase_length');
                        self.aForm.next = false;
                        return false;
                    } else if (self.addForm.get('new').value
                        && self.addForm.get('passphrase').value !== self.addForm.get('cpass').value) {
                        self.aForm.error = self.trans.translate('err.passphrase_cpass');
                        self.aForm.next = false;
                        return false;
                    } else {
                        self.aForm.error = null;
                        self.aForm.next = true;
                        return true;
                    }
                case 3:
                    console.log('Next step ' + self.aForm.next);
                    if (!self.addForm.get('new').value &&
                        self.addForm.get('keyfile').status !== 'INVALID') {
                        console.dir(self.addForm.get('keyfile'));
                        return true;
                    } else {
                        return false;
                    }
                case 4:
                    if (self.addForm.get('receiver').status === 'INVALID') {
                        self.aForm.error = self.trans.translate('err.wrong_receiver');
                        return false;
                    }
                    if (self.addForm.get('ammount').status === 'INVALID') {
                        self.aForm.error = self.trans.translate('err.wrong_ammount');
                        return false;
                    }
                    if (self.addForm.get('gas').status === 'INVALID') {
                        self.aForm.error = self.trans.translate('err.wrong_gas');
                        return false;
                    } else {
                        self.aForm.error = null;
                        return true;
                    }
                case 5:
                    return false;
                default:
                    return false;
            }
        };
        self.aForm.makeStep = function (e) {
            if (e.name === 'next') {
                // self.aForm.step = self.aForm.step < 6 ? self.aForm.step + 1 : 6;
                switch (self.aForm.step) {
                    case 1:
                        self.aForm.step++;
                        self.aForm.back = true;
                        break;
                    case 2:
                        if (self.aForm.validation()) {
                            self.aForm.back = true;
                            self.aForm.step += 1;
                            if (self.addForm.get('new').value) {
                                console.log('Generate Account');
                                self.aForm.next = false;
                                self.wait = true;
                                setTimeout(() => {
                                    self.aForm.createAccount();
                                }, 500);
                            }
                        }
                        break;
                    case 3:
                        break;
                    case 4:
                        if (self.aForm.validation()) {
                            self.aForm.step += 1;
                            self.aForm.back = true;
                            self.wait = true;
                            self.aForm.createRawTx();
                        }
                        break;
                    case 5:
                        self.aForm.step += 1;
                        self.wait = true;
                        self.aForm.sendRawTx();
                        break;
                    case 6:
                        self.aForm.next = false;
                        break;
                    default:
                        break;
                }
            } else {
                switch (self.aForm.step) {
                    case 2:
                        self.aForm.step--;
                        self.aForm.back = false;
                        break;
                    case 3:
                        break;
                    case 4:
                        self.aForm.back = false;
                        break;
                    case 5:
                        self.aForm.step -= 1;
                        break;
                    case 6:
                        self.aForm.step -= 1;
                        break;
                    default:
                        break;
                }
            }
            self.aForm.validation();
            console.log(self.aForm.step);
            console.log(self.addForm.get('passphrase').value);
            console.log(self.addForm.get('cpass').value);
            console.log(self.addForm.get('new').value);
            console.dir(self.addForm.get('keyfile'));
            console.dir(self.aForm.next);
        };
        self.aForm.open = function (files) {
            self.wait = true;
            const params = {
                passphrase: self.addForm.get('passphrase').value,
                symbol: self.selectedCurrency,
                network: self.networks[self.selectedCurrency],
                keyFile: files.target.files[0]
            };
            console.log('Open Account');
            console.dir(params);
            setTimeout(() => {
                self.aService.openAccount(params, account => {
                    self.wait = false;
                    console.dir(account);
                    self.accounts[params.symbol].push(account);
                    console.log('Account response');
                    self.aForm.close();
                });
            }, 100);
        };
        self.aForm.createAccount = function () {
            const params = {
                passphrase: self.addForm.get('passphrase').value,
                symbol: self.selectedCurrency,
                network: self.networks[self.selectedCurrency]
            };
            console.log('Generate');
            console.dir(params);
            self.aService.createAccount(params, account => {
                self.wait = false;
                self.accounts[params.symbol].push(account);
                console.dir(account);
                self.aForm.close();
            });
        };
        self.aForm.close = function () {
            self.initAForm();
            self.addForm.reset();
        };
        self.aForm.openSend = function (account: any) {
            self.initAForm();
            self.aForm.step = 4;
            self.aForm.enable = true;
            self.aForm.sender = account;
            self.aService.getGas()
                .then(gas => {
                    console.dir(gas);
                    self.addForm.get('gas').setValue(gas);
                })
                .catch(err => {
                    self.aForm.error = err;
                });
        };
        self.aForm.createRawTx = function () {
            self.aForm.rawTx = null;
            const opts: any = {};
            opts.symbol = self.aForm.sender.symbol;
            opts.network = self.aForm.sender.network;
            opts.sender = self.aForm.sender.address;
            opts.receiver = self.addForm.get('receiver').value;
            opts.ammount = self.addForm.get('ammount').value;
            opts.gas = self.addForm.get('gas').value;
            self.aService.createTx(opts, rawTx => {
                self.wait = false;
                if (!rawTx.tx) {
                    self.aForm.error = rawTx.err;
                } else {
                    self.aForm.rawTx = rawTx.tx;
                }
            });
        };
        self.aForm.sendRawTx = function () {
            self.aForm.txHash = null;
            self.aService.sendTx({
                symbol: self.aForm.sender.symbol,
                network: self.aForm.sender.network,
                hex: self.aForm.rawTx,
            }, hash => {
                self.wait = false;
                console.dir(hash);
                if (hash.err) {
                    self.aForm.error = self.trans.translate('err.sending_transaction_error')
                    + ' ' + hash.err;
                } else {
                    self.aForm.txHash = hash.hash;
                }
            });
        };
    }
    toDateString(date: Date): string {
        const days = (date.getDate().toString().length < 2) ? '0' + date.getDate()
                : date.getDate(),
            month = ((date.getMonth() + 1).toString().length < 2) ? '0' + (date.getMonth() + 1)
                : (date.getMonth() + 1);
        return days + '.' + month + '.' + date.getFullYear();
    }
    toTimeString(date: Date): string {
        const hours = (date.getHours().toString().length < 2) ? '0' + date.getHours()
            : date.getHours(),
            minutes = (date.getMinutes().toString().length < 2) ? '0' + date.getMinutes()
                : date.getMinutes(),
            seconds = (date.getSeconds().toString().length < 2) ? '0' + date.getSeconds()
                : date.getSeconds();
        return hours + ':' + minutes + ':' + seconds;
    }
    tabSelect(event, symbol) {
        const target = event.target.tagName === 'LI' ?
            event.target : event.target.parentElement,
            lis = document.querySelectorAll('#t-tabset LI');
        for (let k = 0; k < lis.length; k++) {
            lis.item(k).className = '';
        }
        target.className = 'active';
        const conts = document.querySelectorAll('.t-tabset-content .t-content');
        for (let k = 0; k < conts.length; k++) {
            if (conts.item(k).getAttribute('id') === symbol) {
                conts.item(k).setAttribute('style', 'display:block');
            } else {
                conts.item(k).setAttribute('style', 'display:none');
            }
        }
        this.selectedCurrency = symbol;
    }
    tabInit() {
        window.onresize = () => {
            this.setTabs();
        };
        window.onorientationchange = () => {
            this.setTabs();
        };
        window.onload = () => {
            this.setTabs();
        };
    }
    setTabs() {
        const tabsetHeader = document.getElementById('t-tabset-header'),
            tabSet = document.getElementById('t-tabset'),
            tabItems = document.querySelectorAll('.t-tabset-item'),
            ffa = tabsetHeader.parentElement.getElementsByClassName('t-step');
        let tabsLen = 0;
        for (let i = 0; i < tabItems.length; i++) {
            tabsLen += tabItems[i].clientWidth;
        }
        console.log (tabsLen + ' ' + tabSet.clientWidth);
        if (tabsLen > tabSet.clientWidth) {
            tabSet.style.width = tabsLen + 'px';
            // const mar = tabSet.style.marginLeft.replace('px','');
            // tabSet.style.marginLeft = Number(mar) - 30 + 'px';
            console.log(tabSet.style.marginLeft);
            ffa.item(0).className = ffa.item(0).className.indexOf(' t-visible') ?
                ffa.item(0).className + ' t-visible' :
                ffa.item(0).className;
            ffa.item(1).className = ffa.item(1).className.indexOf(' t-visible') ?
                ffa.item(1).className + ' t-visible' :
                ffa.item(1).className;
        } else {
            tabSet.style.width = '100%';
            // const mar = tabSet.style.marginLeft.replace('px','');
            // tabSet.style.marginLeft = Number(mar) + 30 + 'px';
            ffa.item(0).className = ffa.item(0).className.indexOf(' t-visible') ?
                ffa.item(0).className.replace(' t-visible', '') :
                ffa.item(0).className;
            ffa.item(1).className = ffa.item(1).className.indexOf(' t-visible') ?
                ffa.item(1).className.replace(' t-visible', '') :
                ffa.item(1).className;
        }
    }
    left() {
        const tabsetHeader = document.getElementById('t-tabset-header'),
            tabSet = document.getElementById('t-tabset');
        const mar = tabSet.style.marginLeft.replace('px','');
        console.log(tabSet.clientWidth + ' ' + tabsetHeader.clientWidth);
        tabSet.style.marginLeft = tabSet.offsetWidth - tabsetHeader.offsetWidth + Number(mar) > 0 ?
            Number(mar) - 50 + 'px' : tabsetHeader.offsetWidth - tabSet.offsetWidth + 'px';
    }
    right() {
        const tabsetHeader = document.getElementById('t-tabset-header'),
            tabSet = document.getElementById('t-tabset');
        const mar = tabSet.style.marginLeft.replace('px','');
        console.log(tabSet.clientWidth + ' ' + tabsetHeader.clientWidth);
        tabSet.style.marginLeft = Number(mar) < 0 ?
            Number(mar) + 50 + 'px' : '0px';
    }
}
