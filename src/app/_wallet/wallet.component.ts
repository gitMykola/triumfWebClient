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
    passphrase: string;
    cpassphrase: string;
    walletForm: FormGroup;
    error: string;
    user: any;
    auth: boolean;
    account: any;
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
        this.user = JSON.parse(localStorage.getItem('user'));
        this.auth = this.authService.auth;
        if (!this.auth) {
            this.router.navigate(['/']);
        }
        this.account = {};
    }
    createAccount() {
        const self = this;
        const user = JSON.parse(localStorage.getItem('user'));
        if (user.pkf) {
            self.error = 'Account exist into localStorage.';
        } else {
            if (this.walletForm.getRawValue().tpassphrase !== this.walletForm.getRawValue().tcpassphrase) {
                this.error = 'Confirmation passphrase error.';
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
                           user.pkf = response;
                           localStorage.setItem('user', JSON.stringify(user));
                           self.user = user;
                           self.error = 'Account created succesfull.';
                       } else {
                           self.error = 'Request server error.';
                       }
                    });
            }
        }
    }
    getBalance(address: string) {
        this.http.get('http://194.71.227.15/api/v4.0/ETH/getBalance/' + address,
            {
                headers: new HttpHeaders()
                    .set('Content-Type', 'application/json')
            })
            .subscribe(response => {console.dir(response);
                this.account.balance = response ? JSON.stringify(response) : 0.00;
            });
    }
    getTransctions(address: string) {
        this.http.get('http://194.71.227.15/api/v4.0/ETH/getTransactionsList/' + address,
            {
                headers: new HttpHeaders()
                    .set('Content-Type', 'application/json')
            })
            .subscribe(response => {console.dir(response);
                this.account.txs = response; // response ? JSON.stringify(response) : '';
            });
    }
    scripts() {
      //  document.querySelectorAll('.nav-tabs LI').on()
    }
}
