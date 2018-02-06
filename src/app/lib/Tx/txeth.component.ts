import {Component, Input, SimpleChange, OnChanges, EventEmitter, Output} from '@angular/core';
import {TranslatorService} from '../../translator';
import {AccountsService} from '../../_services/accounts.service';
import {ETHTransaction} from '../transaction';

@Component({
    selector: 'app-tx-eth',
    templateUrl: './txeth.component.html',
    styleUrls: ['../../app.component.css']
})
export class TxETHComponent implements OnChanges {
    @Input() hash: string;
    @Input() network: string;
    @Input() symbol: string;
    @Output() onClose = new EventEmitter<boolean>();
    public tx: ETHTransaction;
    public wait: boolean;
    public dom: any;
    public error: boolean;
    public errorMsg: string;
    constructor(public trans: TranslatorService,
                private aService: AccountsService) {
        this.wait = false;
        this.tx = new ETHTransaction();
    }
    ngOnChanges(changes: {[chtx: string]: SimpleChange}) {
        if (changes.hash && changes.hash.currentValue) {
            this.dom = document.getElementById('t-tx-ETH');
            this.show();
            this.wait = true;
            this.aService.getTx({
                hash: this.hash,
                symbol: this.symbol,
                network: this.network
            })
                .then(respTx => {
                    this.wait = false;
                    this.tx = Object.assign(respTx);
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
