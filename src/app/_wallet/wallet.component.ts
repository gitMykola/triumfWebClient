import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {AuthenticationService} from '../_services';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';
import * as EthTxjs from '../../../node_modules/ethereumjs-tx';
import * as EthUtils from '../../../node_modules/ethjs-util';
import * as EthSigner from '../../../node_modules/ethjs-signer';
import * as Scri from '../../../node_modules/scryptsy';
import * as Bn from '../../../node_modules/bignumber';
import * as keythe from '../../../node_modules/keythereum';
import * as crypt from '../../../node_modules/crypto-browserify';
import * as jsonfs from '../../../node_modules/jsonfile';
import { Buffer } from 'buffer';

@Component({
    selector: 'app-t-wallet',
    templateUrl: './wallet.component.html',
})
export class WalletComponent implements OnInit {
    title = '';
    formVisible: boolean;
    accFormVisible: boolean;
    txFormVisible: boolean;
    passphrase: string;
    cpassphrase: string;
    walletForm: FormGroup;
    openForm: FormGroup;
    txForm: FormGroup;
    error: string;
    errorAcc: string;
    errorTx: string;
    user: any;
    accAddress: string;
    accPkey: string;
    auth: boolean;
    account: any;
    accounts: any;
    currentAccount: any;
    keyFile: File;
    txTo: string;
    txValue: number;
    txGasLimit: number;
    rawTx: string;
    constructor(
        private authService: AuthenticationService,
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router) {
    }
    ngOnInit() {
        this.title = 'Wallet';
        this.formVisible = false;
        this.accFormVisible = false;
        this.txFormVisible = false;
        this.rawTx = '';
        this.walletForm = this.fb.group({
            tpassphrase: [this.passphrase, [Validators.required]],
            tcpassphrase: [this.cpassphrase, [Validators.required]]
        });
        this.openForm = this.fb.group({
            tkeyFile: [this.keyFile, [Validators.required]],
            tpassForKey: [this.accPkey, [Validators.required]]
        });
        this.txForm = this.fb.group({
            ttxTo: [this.accPkey, [Validators.required]],
            ttxValue: [this.txValue, [Validators.required]],
            ttxGasLimit: [this.txGasLimit, [Validators.required]]
        });
        this.user = JSON.parse(localStorage.getItem('user'));
        this.auth = this.authService.auth;
        /*if (!this.auth) {
            this.router.navigate(['/']);
        }*/
        const acc = localStorage.getItem('accounts');
        // console.dir(acc);
         this.accounts = acc ? acc.split(']____[').map(e => {
             return JSON.parse(e);
         }) : [];
        const last = this.accounts.length ? localStorage.getItem('lastAccount') : null;
        this.currentAccount = last ? this.accounts[last] : null;
    }
    generate(password, next) {
        const params = { keyBytes: 32, ivBytes: 16 };
        const dk = keythe.create(params);
        console.dir(dk.privateKey.toString('hex'));
        const kdf = 'pbkdf2';
        const options = {
            kdf: 'scrypt', // ,'pbkdf2',
            cipher: 'aes-128-ctr',
            kdfparams: {
                n: 262144,
                dklen: 32,
                p: 8,
                r: 1
                    // prf: 'hmac-sha256' somePass1Wf
            }
        };
        const keyFile = keythe.dump(password, dk.privateKey, dk.salt, dk.iv,
            options);
        console.dir(keyFile);
        const txParams = {
            nonce: '0x00',
            gasPrice: EthUtils.intToHex(1000),
            gasLimit: EthUtils.intToHex(21000),
            to: '0xb81d25710e306d8f245d8b8bcaf1c91479c2eb86',
            value: '0x00', // EthUtils.intToHex(self.txForm.getRawValue().ttxValue),
            data: '0x00',
            // EIP 155 chainId - mainnet: 1, ropsten: 3
            chainId: 3
        };
        const tx = new EthTxjs(txParams);
        let dkey = Scri(new Buffer(password),
            new Buffer(keyFile.crypto.kdfparams.salt, 'hex'),
            keyFile.crypto.kdfparams.n, keyFile.crypto.kdfparams.r,
            keyFile.crypto.kdfparams.p, keyFile.crypto.kdfparams.dklen);
        // keythe.exportToFile(keyFile);
        // console.dir(keyFile);
        dkey = keythe.recover(password, keyFile);
        console.dir(dkey.toString('hex'));
        tx.sign(dkey);
        // keyFile.address = tx.from.toString('hex');
        console.dir(keyFile);
        const blob = new Blob([JSON.stringify(keyFile)], {type: 'text/json'});
        const e = document.createEvent('MouseEvent');
        const a = document.createElement('a');
        a.download = this.keyFileName(keyFile.address);
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window,
            0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
        next('0x' + keyFile.address);
    }
    createAccount() {
        const self = this;
            if (this.walletForm.getRawValue().tpassphrase !== this.walletForm.getRawValue().tcpassphrase) {
                this.error = 'Confirmation passphrase error.';
            } else if (this.walletForm.getRawValue().tpassphrase.length < 8) {
                this.error = 'Passphrase should be at least 8 characters!';
        } else {
                self.generate(this.walletForm.getRawValue().tpassphrase, address => {
                    self.currentAccount = {
                        address: address
                    };
                    self.error = 'Account ' + address + ' generated successful.';

                });
                /*const body = {
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
                    });*/
        }
    }
    openAccount(files) {
        const self = this;
        self.currentAccount = {};
        self.currentAccount.address = 'Wait ...';
        self.accFormVisible = false;
        try {
            if (!self.openForm.getRawValue().tpassForKey
                || self.openForm.getRawValue().tpassForKey.length < 8) {
                self.errorAcc = 'Passphrase should be at least 8 characters!';
            } else {
                console.dir(files.target.files[0]);
                const file = new FileReader();
                file.readAsText(files.target.files[0]);
                file.onload = (event: any) => {
                    const keyFile: any = JSON.parse(event.target.result);
                    console.dir(keyFile);
                    self.currentAccount = {};
                    self.currentAccount.keyFile = keyFile;
                    const kdfparams = keyFile.crypto.kdfparams;
                    const dk = keythe.recover(self.openForm.getRawValue().tpassForKey, keyFile);
                    /*Scri(new Buffer(self.openForm.getRawValue().tpassForKey),
                    new Buffer(kdfparams.salt, 'hex'),
                    kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen);*/
                    /*crypt.pbkdf2Sync(
                        new Buffer(self.openForm.getRawValue().tpassForKey),
                        new Buffer(kdfparams.salt, 'hex'),
                        kdfparams.c,
                        kdfparams.dklen,
                        'sha256'
                    );*/
                    console.dir(dk.toString('hex'));
                    // self.accPkey = '0x' + dk.toString('hex');
                    self.accPkey = dk;
                    self.currentAccount.address = '0x' + keyFile.address;
                    /*keythe.recover(self.accountForm.getRawValue().tpassphrase,
                        self.keyFile, pk => {
                        console.dir(pk);
                    });*/
                };
                /*self.account = {
                    address: self.accountForm.getRawValue().taddress,
                    currencySymbol: 'ETH',
                    privateKey: self.accountForm.getRawValue().tpkey,
                    keyFile: {}
                };*/
                /*
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
                }*/
            }
        } catch (error) {
            self.errorAcc = 'Open Acount Error!';
            console.dir(error);
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
    keyFileName (address: string): string {
        const cd = new Date();
        const month = ((cd.getMonth() + 1).toString().length === 1) ?
            '0' + (cd.getMonth() + 1).toString() : (cd.getMonth() + 1).toString();
        const days = (cd.getDay().toString().length === 1) ?
            '0' + cd.getDay().toString() : cd.getDay().toString();
        const hours = (cd.getHours().toString().length === 1) ?
            '0' + cd.getHours().toString() : cd.getHours().toString();
        const mins = (cd.getMinutes().toString().length === 1) ?
            '0' + cd.getMinutes().toString() : cd.getMinutes().toString();
        const seconds = (cd.getSeconds().toString().length === 1) ?
            '0' + cd.getSeconds().toString() : cd.getSeconds().toString();
        const mseconds = (cd.getMilliseconds().toString().length === 1) ?
            '00' + cd.getMilliseconds().toString() :
            ((cd.getMilliseconds().toString().length === 2) ? '0' + cd.getMilliseconds().toString()
                : cd.getMilliseconds().toString());
        const filename = 'UTC--' + cd.getFullYear() + '-'
            + month + '- ' + days + 'T' + hours + ':' + mins + ':' + seconds + '.' + mseconds +
            'Z--' + address;
        return filename;
    }
    scripts() {
      // localStorage.removeItem('accounts');
    }
    createTx() {
        const self = this;
        if (!self.txForm.getRawValue().ttxTo
        || self.txForm.getRawValue().ttxTo.length !== 42) {
            self.errorTx = 'Wrong receiver address!';
        } else if (!self.txForm.getRawValue().ttxValue
        || !self.txForm.getRawValue().ttxValue) {
            self.errorTx = 'Wrong transaction ammount!';
        } else {
            self.getApi({
                method: 'getPriceLimit'
            }, gasPriceLimit => {
                if (!gasPriceLimit) {
                    self.errorTx = 'Server error!';
                } else {
                    self.getApi({
                        method: 'getTransactionCount',
                        address: self.currentAccount.address
                    }, txCount => {
                        if (!txCount) {
                            self.errorTx = 'Server error!';
                        } else {
                            const gp: any = gasPriceLimit;
                            console.log(self.txForm.getRawValue().ttxValue.toString(10));
                            console.log('0x' +
                                (self.txForm.getRawValue().ttxValue * 1e18)
                                    .toString(16));
                            const txParams = {
                                nonce: '0x' + EthUtils.intToHex(txCount.TransationCount),
                                // from: self.currentAccount.address,
                                gasPrice: EthUtils.intToHex(gp.gasPrice),
                                gasLimit: EthUtils.intToHex(self.txForm.getRawValue().ttxGasLimit),
                                to: self.txForm.getRawValue().ttxTo,
                                value: '0x' +
                                (self.txForm.getRawValue().ttxValue * 1e18)
                                    .toString(16),
                                // Bn.b64tohex(Math.round(self.txForm.getRawValue().ttxValue * 1.e18)),
                                data: '',
                                // EIP 155 chainId - mainnet: 1, ropsten: 3
                                chainId: 3
                            };
                            const tx = new EthTxjs(txParams);
                            console.dir(tx);
                            // EthSigner.sign(txParams, self.accPkey, false);
                            // const rawTx = EthSigner.sign(txParams, self.accPkey, false); // tx.serialize();
                            tx.sign(self.accPkey);
                            console.dir(tx.from.toString('hex'));
                            console.dir(tx.to.toString('hex'));
                            console.dir(tx.gasPrice.toString('hex'));
                            console.dir(tx.gasLimit.toString('hex'));
                            console.dir(tx.data.toString('hex'));
                            console.log('Value ' + tx.value.toString('hex'));
                            const rawTx = tx.serialize();
                                self.rawTx = '0x' + rawTx.toString('hex');
                        }
                    });
                }
            });
        }
    }
    sendRaw() {
        const self = this;
        self.getApi({
            method: 'sendRawTransaction',
            hex: self.rawTx
        }, hash => {
            if (!hash || hash.hs.err) {
                console.dir(hash);
                self.errorTx = 'Send Raw Transaction Error';
            } else {
                self.rawTx = 'Transaction hash: ' + hash.hs.hash;
            }
        });
    }
    getApi(opts: any, next: any) {
        const self = this;
        opts.url = 'http://194.71.227.15/api/v4.0/';
        opts.headers = {
            headers: new HttpHeaders()
                .set('Content-Type', 'application/json')
        };
        if (!opts.method) {
            next(null);
        } else {
            switch (opts.method) {
                case 'getBalance': {
                    self.http.get(opts.url + 'ETH/getBalance/' + opts.address,
                        opts)
                        .subscribe(response => {console.dir(response);
                            next(response ? response : null);
                        });
                    break;
                }
                case 'getTransactions': {
                    self.http.get(opts.url + 'ETH/getTransactionsList/' + opts.address,
                        opts)
                        .subscribe(response => {console.dir(response);
                            next(response ? response : null);
                        });
                    break;
                }
                case 'getPriceLimit': {
                    self.http.get(opts.url + 'ETH/getPriceLimit',
                        opts)
                        .subscribe(response => {console.dir(response);
                            next(response ? response : null);
                        });
                    break;
                }
                case 'sendRawTransaction': {
                    self.http.get(opts.url + 'ETH/sendRawTransaction/' +
                        opts.hex,
                        opts)
                        .subscribe(response => {console.dir(response);
                            next(response ? response : null);
                        });
                    break;
                }
                case 'getTransactionCount': {
                    console.log(opts.url + 'ETH/getTransactionCount/' +
                    opts.address);
                    self.http.get(opts.url + 'ETH/getTransactionCount/' +
                        opts.address,
                        opts)
                        .subscribe(response => {console.dir(response);
                            next(response ? response : null);
                        });
                    break;
                }
                default: next(null);
            }
        }
    }
}
// 0xF19891B91060593b27162Cb2BE19B2507D41e809
// 0xF19891B91060593b27162Cb2BE19B2507D41e809
