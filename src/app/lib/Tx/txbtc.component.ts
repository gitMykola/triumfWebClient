import {Component, OnInit, Input} from '@angular/core';
import {TranslatorService} from '../../translator';
import {AccountsService} from '../../_services/accounts.service';

@Component({
    selector: 'app-tx-btc',
    templateUrl: './txbtc.component.html',
    styleUrls: ['../../app.component.css']
})
export class TxBTCComponent implements OnInit {
    @Input() tx: any;
    constructor(public trans: TranslatorService) {
    }
    ngOnInit() {
    }
    close() {
        const selfEl = document.getElementById('t-tx-BTC');
        selfEl.className = selfEl.className
            .replace(' t-showFade', ' t-hideFade');
        setTimeout(() => {
            selfEl.className = selfEl.className.replace(' t-hideFade', ' t-hidden');
        } , 301);
        this.tx.error = false;
        this.tx.errorMsg = '';
        this.tx = {};
    }
}
