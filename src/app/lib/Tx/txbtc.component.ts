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
        const self = this;
        if (changes.id && changes.id.currentValue) {
            self.dom = document.getElementById('t-tx-BTC');
            self.show();
            self.wait = true;
            self.aService.getTx({
                id: self.id,
                symbol: self.symbol,
                network: self.network
            })
                .then(respTx => {
                    const rtx: any = respTx;
                    self.wait = false;
                    self.tx = Object.assign(respTx);
                    self.tx.fees = new Big(self.tx.fees);
                    self.tx.size = new Big(self.tx.size);
                    self.tx.feeRate = self.tx.fees.dividedBy(
                        self.tx.size.dividedBy(1000));
                    self.tx.sumVout = self.tx.vout ? self.tx.vout.reduce((a, b) =>
                        new Big(a.value).plus(b.value)) : null;
                    self.tx.timestamp = new Date(rtx.time * 1000);
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
