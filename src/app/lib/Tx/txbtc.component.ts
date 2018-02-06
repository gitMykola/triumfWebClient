import {Component, Input, SimpleChange, OnChanges, Output, EventEmitter} from '@angular/core';
import {TranslatorService} from '../../translator';
import {AccountsService} from '../../_services/accounts.service';
import {BTCTransaction} from '../transaction';
import * as Big from 'bignumber.js';

@Component({
    selector: 'app-tx-btc',
    templateUrl: './txbtc.component.html',
    styleUrls: ['../../app.component.css']
})
export class TxBTCComponent implements OnChanges {
    @Input() id: string;
    @Input() network: string;
    @Input() symbol: string;
    @Output() onClose = new EventEmitter<boolean>();
    public tx: BTCTransaction;
    public wait: boolean;
    public dom: any;
    public error: boolean;
    public errorMsg: string;
    constructor(public trans: TranslatorService,
                private aService: AccountsService) {
        this.wait = false;
        this.tx = new BTCTransaction();
    }
    ngOnChanges(changes: {[chtx: string]: SimpleChange}) {
        if (changes.id && changes.id.currentValue) {
            this.dom = document.getElementById('t-tx-BTC');
            this.show();
            this.wait = true;
            this.aService.getTx({
                id: this.id,
                symbol: this.symbol,
                network: this.network
            })
                .then(respTx => {
                    this.wait = false;
                    this.tx = Object.assign(respTx);
                    this.tx.fees = new Big(this.tx.fees);
                    this.tx.size = new Big(this.tx.size);
                    this.tx.feeRate = this.tx.fees.dividedBy(
                        this.tx.size.dividedBy(1000));
                    this.tx.sumVout = this.tx.vout ? this.tx.vout.reduce((a, b) =>
                        new Big(a.value).plus(b.value)) : null;
                })
                .catch(err => {
                    this.wait = false;
                    this.error = true;
                    this.errorMsg = err;
                });
        }
    }
    close() {
        this.hide();
        this.error = false;
        this.errorMsg = '';
        this.onClose.emit(true);
    }
    show() {
        this.dom.style.marginTop = window.scrollY + 'px';
        this.dom.className = this.dom.className.replace(' t-hidden', ' t-showFade');
    }
    hide() {
        this.dom.className = this.dom.className
            .replace(' t-showFade', ' t-hideFade');
        setTimeout(() => {
            this.dom.className = this.dom.className.replace(' t-hideFade', ' t-hidden');
        } , 301);
    }
}
