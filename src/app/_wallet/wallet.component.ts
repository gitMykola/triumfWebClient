import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {AuthenticationService} from '../_services';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';

@Component({
    selector: 'app-t-wallet',
    templateUrl: './wallet.component.html',
})
export class WalletComponent implements OnInit {
    title = '';
    formVisible: boolean;
    accFormVisible: boolean;
    passphrase: string;
    cpassphrase: string;
    walletForm: FormGroup;
    accountForm: FormGroup;
    error: string;
    errorAcc: string;
    user: any;
    accAddress: string;
    accPkey: string;
    auth: boolean;
    account: any;
    accounts: any;
    currentAccount: any;
    constructor(
        private authService: AuthenticationService,
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router) {
    }
    ngOnInit() {
        this.title = 'Wallet';
        this.formVisible = false;
        this.walletForm = this.fb.group({
            tpassphrase: [this.passphrase, [Validators.required]],
            tcpassphrase: [this.cpassphrase, [Validators.required]]
        });
        this.accountForm = this.fb.group({
            taddress: [this.accAddress, [Validators.required]],
            tpkey: [this.accPkey, [Validators.required]]
        });
        this.user = JSON.parse(localStorage.getItem('user'));
        this.auth = this.authService.auth;
        if (!this.auth) {
            this.router.navigate(['/']);
        }
        const acc = localStorage.getItem('accounts');
        console.dir(acc);
         this.accounts = acc ? acc.split(']____[').map(e => {
             return JSON.parse(e);
         }) : [];
        const last = this.accounts.length ? localStorage.getItem('lastAccount') : null;
        this.currentAccount = last ? this.accounts[last] : null;
    }
    createAccount() {
        const self = this;
            if (this.walletForm.getRawValue().tpassphrase !== this.walletForm.getRawValue().tcpassphrase) {
                this.error = 'Confirmation passphrase error.';
            } else if (this.walletForm.getRawValue().tpassphrase.length < 8) {
                this.error = 'Passphrase should be more then 7 symbols!';
        } else {
                const body = {
                    pass: btoa(self.walletForm.getRawValue().tpassphrase)
                };
                this.http.post('http://194.71.227.15/api/v4.0/ETH/createETHAccountWithPassword',
                    body,
                    {
                        headers: new HttpHeaders()
                            .set('Content-Type', 'application/json')
                    })
                    .subscribe(response => {
                       if (response) {
                           self.account = {pkf: null};
                           self.account.pkf = response;
                           self.accounts.push({
                               address: self.account.pkf.keyFile.address,
                               currencySymbol: 'ETH',
                               privateKey: self.account.pkf.privateKey,
                               keyFile: self.account.pkf.keyFile
                           });
                           self.currentAccount = self.account;
                           localStorage.setItem('accounts', self.accounts.map(e => {
                               return JSON.stringify(e);
                           }).join(']____['));
                           localStorage.setItem('last', self.currentAccount.address);
                           self.error = 'Account' + self.currentAccount.address + ' created succesfull.';
                       } else {
                           self.error = 'Request server error.';
                       }
                    });
        }
    }
    addAccount() {
        const self = this;
        self.account = {
            address: self.accountForm.getRawValue().taddress,
            currencySymbol: 'ETH',
            privateKey: self.accountForm.getRawValue().tpkey,
            keyFile: {}
        };
        let exist = 0;
        for (let i = 0; i < self.accounts.length; i++) {
            if (self.account.address === self.accounts[i].address) {
                self.errorAcc = 'Account ' + self.account.address + ' exist!';
                exist = 1;
            }
        }
        if (!exist) {
            console.dir(self.account);
            self.accounts.push(self.account);
            self.currentAccount = self.account;
            localStorage.setItem('accounts', self.accounts.map(e => {
                return JSON.stringify(e);
            }).join(']____['));
            localStorage.setItem('last', self.currentAccount.address);
            self.errorAcc = 'Account ' + self.currentAccount.address + ' added succesfull.';
        }
    }
    selectAccount(acc: object) {
        this.currentAccount = acc;
    }
    getBalance() {
        const self = this;
        self.http.get('http://194.71.227.15/api/v4.0/ETH/getBalance/' + self.currentAccount.address,
            {
                headers: new HttpHeaders()
                    .set('Content-Type', 'application/json')
            })
            .subscribe(response => {console.dir(response);
                self.currentAccount.bal = response ? response : 0.00;
            });
    }
    getTransctions() {
        const self = this;
        self.http.get('http://194.71.227.15/api/v4.0/ETH/getTransactionsList/' + self.currentAccount.address,
            {
                headers: new HttpHeaders()
                    .set('Content-Type', 'application/json')
            })
            .subscribe(response => {console.dir(response);
                self.currentAccount.txs = response ? response : null;
            });
    }
    scripts() {
      //  document.querySelectorAll('.nav-tabs LI').on()
    }
}
