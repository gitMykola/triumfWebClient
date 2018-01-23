import { Injectable } from '@angular/core';
import { Account } from '../lib/account';
import { config } from '../config';
import {TranslatorService} from '../translator';
import * as Keythe from '../../../node_modules/keythereum';
import * as EthTxjs from '../../../node_modules/ethereumjs-tx';

@Injectable()
export class AccountsService {
    private _config: any;
    public accounts: any;
    public infoMessage: string;
    public errorMessage: string;

    constructor(public trans: TranslatorService) {
        this._config = config();
        this.accounts = [];
    }
    info(msg: string) {
        this.infoMessage = msg;
        if (this._config.dev.mode){
            console.log(msg);
        }
    }
    error(msg: string) {
        this.errorMessage = msg;
        if (this._config.dev.mode) {
            console.log(msg);
        }
    }
    infoInit() {
        this.infoMessage = this.errorMessage = null;
    }
    getAccounts(): any {
        return this.accounts.map(el => {
            return {
                address: el.address,
                network: el.network,
                symbol: el.symbol
            };
        });
    }
    isOpen(address: string, network: string): boolean {
        this.infoInit();
        const acc = this.accounts.
        filter(el => { return el.address === address && el.network === network; });
        if (!acc.length) {
            this.error(this.trans.translate('err.account_not_exists') + ' ' + address);
            return false;
        } else if (acc[0].key !== null) {
            this.info(this.trans.translate('info.account_open') + ' ' + address);
            return true;
        } else {
            this.error(this.trans.translate('info.account_closed') + ' ' + address);
            return false;
        }
    }
    getAccountBalance(address: string, callback: any) {
        this.infoInit();
        return '0.00';
    }
    getAccountTransactions(address: string, callback: any) {
        this.infoInit();
        return [];
    }
    createTx(params: any, callback: any) {
        this.infoInit();
        return '';
    }
    sendTx(hex: string, callback: any) {
        this.infoInit();
        return '';
    }
    createAccount(params: any, next: any) {
        params.passphrase = params.passphrase || null;
        params.symbol = params.symbol || null;
        params.network = params.network || null;
        this.infoInit();
        if (!this._verifyAccountParams(params)) {
            next({err: this.errorMessage});
        } else {
            switch (params.symbol) {
                case 'ETH':
                    this._createETHAccount(params, response => {
                       if (response.err) {
                           this.error(this.trans.translate('err.create_account_error'));
                           next({err: this.errorMessage});
                       } else {
                           this.info(this.trans.translate('info.account_created_successfully') + ' ' +
                           response.account.address);
                           next(response);
                       }
                    });
                    break;
                case 'BTC':
                    this._createBTCAccount(params, response => {
                        if (response.err) {
                            this.error(this.trans.translate('err.create_account_error'));
                            next({err: this.errorMessage});
                        } else {
                            this.info(this.trans.translate('info.account_created_successfully') + ' ' +
                                response.account.address);
                            next(response);
                        }
                    });
                    break;
                default:
                    next({err: 'Error'});
                    break;
            }
        }
    }
    openAccount(params: any, next: any) {
        params.symbol = params.symbol || null;
        params.keyFile = params.keyFile || null;
        params.passphrase = params.passphrase || null;
        params.network = params.network || null;
        console.log('Step 6');
        this.infoInit();
         if (!this._verifyAccountParams(params)) {
             console.log('Step 7');
             next({err: this.errorMessage});
         } else {
                if (params.address && this.isOpen(params.address, params.network)) {
                    this.info(this.trans.translate('info.account_already_open'));
                    next({account:
                            {
                                address: params.address,
                                symbol: params.symbol,
                                network: params.network
                            }
                    });
                } else {
                    switch (params.symbol) {
                        case 'ETH':
                            this._openETHAccount(params, response => {
                                console.dir(response);
                                if (response.err) {
                                    this.error(this.trans.translate('err.open_account_error'));
                                    next({err: this.errorMessage});
                                } else {
                                    this.info(this.trans.translate('info.account_opened_successfully') +
                                    ' ' + response.address);
                                    next({account: response.account});
                                }
                            });
                            break;
                        case 'BTC':
                            this._openBTCAccount(params, response => {
                                if (response.err) {
                                    this.error(this.trans.translate('err.open_account_error'));
                                    next({err: response.err + ' '
                                        + this.errorMessage});
                                } else {
                                    this.info(this.trans.translate('info.account_open_successfully') +
                                        ' ' + response.account.address);
                                    next({account: response.account});
                                }
                            });
                            break;
                        default: {
                            next({err: 'Error'});
                            break;
                        }
                    }
                }
        }
    }
    closeAcount(address: string, network: string): boolean {
        const acc = this.accounts.
        filter(el => { return el.address === address && el.network === network; });
        if (!acc.length) {
            this.error(this.trans.translate('err.account_not_exists') + ' ' + address);
            return false;
        } else if (acc[0].key !== null) {
            this.accounts.forEach(el => {
                if (el.address === address && el.network === network) {
                    el.key = null;
                }
            });
            this.info(this.trans.translate('info.account_closed') + ' ' + address);
            return true;
        } else {
            this.info(this.trans.translate('info.account_already_closed') + ' ' + address);
            return false;
        }
    }
    _verifyAccountParams(params: any): boolean {
        console.log('step 15');
        if (typeof params !== 'object'){
            this.error(this.trans.translate('err.wrong_account_params_object'));
            console.log('step 8');
            return false;
        } else {
            console.log('step 16');
            for (const ind in params) {
                console.log('step 19');
            if (!params[ind]) {
                this.error(this.trans.translate('err.wrong_account_params_object'));
                console.log('step 9');
                return false;
            } else {
                switch (ind) {
                    case 'symbol':
                        if ( typeof params[ind] !== 'string'
                            || !this._config.symbols.filter(el => {
                                return el === params[ind];
                            }).length) {
                            this.error(this.trans.translate('err.wrong_symbol'));
                            console.log('step 10');
                            return false;
                        }
                        break;
                    case 'passphrase':
                        if ( typeof params[ind] !== 'string'
                            || params[ind].length < 8 || params[ind].length > 256) {
                            this.error(this.trans.translate('err.wrong_passphrase'));
                            console.log('step 11');
                            return false;
                        }
                        break;
                    case 'address':
                        if ( typeof params[ind] !== 'string'
                            || params[ind].length < 32 || params[ind].length > 64) {
                            this.error(this.trans.translate('err.wrong_address'));
                            console.log('step 17');
                            return false;
                        }
                        break;
                    case 'pKey':
                        if ( typeof params[ind] !== 'string'
                            || params[ind].length < 32 || params[ind].length > 256) {
                            this.error(this.trans.translate('err.bad_key'));
                            console.log('step 18');
                            return false;
                        }
                        break;
                    case 'keyFile':
                        if ( typeof params[ind] !== 'object') {
                            this.error(this.trans.translate('err.bad_key_file'));
                            console.log('step 12');
                            return false;
                        }
                        break;
                    case 'network':
                        if ( typeof params[ind] !== 'string'
                            || !this._config.networks.filter(el => {
                                return el === params[ind];
                            }).length) {
                            this.error(this.trans.translate('err.bad_network'));
                            console.log('step 13');
                            return false;
                        }
                        break;
                    default: {
                        this.error(this.trans.translate(
                            'err.wrong_account_params_object_field') + ' ' + ind);
                        console.log('step 14');
                        return false;
                    }
                }
            }
        }
        return true;
        }/*{
            params.symbol = params.symbol || null;
            if (!params.symbol || !this._config.symbols.filter(el => {
                return el === params.symbols;
                }).length) {
                this.error(this.trans.translate('err.wrong_currency_symbol'));
                return false;
            } else {

            }
        }*/
    }
    _openETHAccount(params: any, callback: any) {
        try {
            const file = new FileReader();
            file.readAsText(params.keyFile);
            file.onload = (event: any) => {
                const keyFile: any = JSON.parse(event.target.result);
                try {
                    Keythe.recover(params.passphrase, keyFile, (pKey) => {
                        if (pKey) {
                            const account = new Account();
                            account.address = '0x' + keyFile.address;
                            account.key = pKey;
                            account.network = params.network;
                            account.symbol = params.symbol;
                            this.accounts.push(account);
                            callback(account);
                        } else {
                            this.error(this.trans.translate('err.eth_account_open_error'));
                            callback({err: this.errorMessage});
                        }
                    });
                } catch (e) {
                    this.error(e.message);
                    callback({e: this.errorMessage});
                }

            };
        } catch (err) {
            this.error(err.message);
            callback({err: this.errorMessage});
        }
    }
    _openBTCAccount(params: any, callback: any) {}
    _createETHAccount(params: any, callback: any) {
        try {
            const opts = { keyBytes: 32, ivBytes: 16 },
                dk = Keythe.create(opts),
                options = {
                        kdf: 'scrypt', // ,'pbkdf2',
                        cipher: 'aes-128-ctr',
                        kdfparams: {
                            n: 262144,
                            dklen: 32,
                            p: 8,
                            r: 1
                            // prf: 'hmac-sha256' somePass1Wf
                        }
                    },
                keyFile = Keythe.dump(
                    params.passphrase,
                    dk.privateKey,
                    dk.salt,
                    dk.iv,
                    options);
            if (keyFile) {
                const blob = new Blob([JSON.stringify(keyFile)], {type: 'text/json'});
                const e = document.createEvent('MouseEvent');
                const a = document.createElement('a');
                a.download = this._keyFileName(keyFile.address);
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
                e.initMouseEvent('click', true, false, window,
                    0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
                const account = new Account();
                account.address = '0x' + keyFile.address;
                account.key = dk.toString('hex');
                account.network = params.network;
                account.symbol = params.symbol;
                this.accounts.push(account);
                callback(account);
            } else {
                this.error(this.trans.translate('err.eth_account_create_error'));
                callback({err: this.errorMessage});
            }
        } catch (err) {
            this.error(err.message);
            callback({err: this.errorMessage});
        }
    }
    _createBTCAccount(params: any, callback: any) {}
    _keyFileName (address: string): string {
        const cd = new Date();
        const month = ((cd.getMonth() + 1).toString().length === 1) ?
            '0' + (cd.getMonth() + 1).toString() : (cd.getMonth() + 1).toString();
        const days = (cd.getDate().toString().length === 1) ?
            '0' + cd.getDate().toString() : cd.getDate().toString();
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
}
