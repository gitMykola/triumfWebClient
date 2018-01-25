import {Component, OnInit, Input} from '@angular/core';
import {TranslatorService} from '../../translator';
import {AccountsService} from '../../_services/accounts.service';

@Component({
    selector: 'app-tx',
    templateUrl: './tx.component.html'
})
export class TxComponent implements OnInit {
    @Input() tx: Object;
    state: boolean;
    selectedTx: any;
    constructor(private trans: TranslatorService,
                private aService: AccountsService) {
        this.state = false;
    }
    ngOnInit() {
        this.aService.getTx(this.tx, res => {
            this.selectedTx = res;
            console.dir(res);
        });
    }
}
