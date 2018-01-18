import { Injectable } from '@angular/core';
import { Account } from '../lib/account';
import { config } from '../config';
import {TranslatorService} from '../translator';

@Injectable()
export class AccountsService {
    private _config: any;
    public accounts: Account[];
    public infoMessage: string;
    public errorMessage: string;

    constructor(public trans: TranslatorService) {
        this._config = config();
    }
    info(msg: string) {
        this.infoMessage = msg;
        if (this._config.dev.mode){
            console.log(msg);
        }
    }
    error(msg: string) {
        this.errorMessage = msg;
        if (this._config.dev.mode){
            console.log(msg);
        }
    }
    infoInit() {
        this.infoMessage = this.errorMessage = null;
    }
    isOpen(address: string): boolean {
        this.infoInit();
        const acc = this.accounts.
        filter(el => { return el.address = address; });
        if (!acc.length) {
            this.error(this.trans.translate('err.account_not_exists') + ' ' + address);
            return false;
        } else if (acc[0].key !== null) {
            this.info(this.trans.translate('info.account_open') + ' ' + address);
            return true;
        } else {
            this.error('Account ' + address + ' closed');
            return false;
        }
    }
    getAccountBalance(address: string): string {
        this.infoInit();
        return '0.00';
    }
    getAccountTransactions(address: string): object {
        this.infoInit();
        return [];
    }
    createTx(params: object): string {
        this.infoInit();
        return '';
    }
    sendTx(hex: string): string {
        this.infoInit();
        return '';
    }
    openAccount(params: any, next: any) {
        this.infoInit();
         if (!this._verifyAccountParams(params)) {
             next({err: this.errorMessage});
         } else {
                if (this.isOpen(params.address)) {
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
                            return false;
                        }
                    }
                }
        }
    }
    closeAcount(address: string): boolean {
        return true;
    }
    _verifyAccountParams(params: any): boolean {
        if (typeof params !== 'object'){
            this.error(this.trans.translate('err.wrong_account_params_object'));
            return false;
        } else for (const ind in params) {
            if (!params[ind]) {
                this.error(this.trans.translate('err.wrong_account_params_object'));
                return false;
            } else {
                switch (ind) {
                    case 'symbol':
                        if ( typeof params[ind] !== 'string'
                            || !this._config.symbols.filter(el => {
                                return el === params[ind];
                            }).length) {
                            this.error(this.trans.translate('err.wrong_symbol'));
                            return false;
                        }
                        break;
                    case 'passphrase':
                        if ( typeof params[ind] !== 'string'
                            || params[ind].length < 8 || params[ind].length > 256) {
                            this.error(this.trans.translate('err.wrong_passphrase'));
                            return false;
                        }
                        break;
                    case 'address':
                        if ( typeof params[ind] !== 'string'
                            || params[ind].length < 32 || params[ind].length > 64) {
                            this.error(this.trans.translate('err.wrong_address'));
                            return false;
                        }
                        break;
                    case 'pKey':
                        if ( typeof params[ind] !== 'string'
                            || params[ind].length < 32 || params[ind].length > 256) {
                            this.error(this.trans.translate('err.bad_key'));
                            return false;
                        }
                        break;
                    case 'keyFile':
                        if ( typeof params[ind] !== 'object') {
                            this.error(this.trans.translate('err.bad_key_file'));
                            return false;
                        }
                        break;
                    case 'network':
                        if ( typeof params[ind] !== 'string'
                            || !this._config.networks.filter(el => {
                                return el === params[ind];
                            }).length) {
                            this.error(this.trans.translate('err.bad_network'));
                            return false;
                        }
                        break;
                    default: {
                        this.error(this.trans.translate(
                            'err.wrong_account_params_object_field') + ' ' + ind);
                        return false;
                    }
                }
            }
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
    _openETHAccount(params: any, callback: any) {}
    _openBTCAccount(params: any, callback: any) {}
}
