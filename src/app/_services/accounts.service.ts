import { Injectable } from '@angular/core';
import { Account } from '../lib/account';
import { config } from '../config';
import {TranslatorService} from '../translator';
import * as Keythe from '../../../node_modules/keythereum';
import * as EthTx from '../../../node_modules/ethereumjs-tx';
import * as EthUtils from 'ethjs-util';
import {Buffer} from 'buffer';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable()
export class AccountsService {
    private _config: any;
    public accounts: any;
    public infoMessage: string;
    public errorMessage: string;

    constructor(
        public trans: TranslatorService,
        private http: HttpClient) {
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
                symbol: el.symbol,
                transactions: el.transactions
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
    getAccountBalance(params: any, next: any) {
        const opts: any = {};
        opts.address = params.address || null;
        opts.symbol = params.symbol || null;
        opts.network = params.network || null;
        this.infoInit();
        if (!this._verifyAccountParams(opts)) {
            next({err: this.errorMessage});
        } else {
            opts.method = 'getBalance';
            this._getApi(opts, bs => {
                if (!bs) {
                    this.error(this.trans.translate('err.server_connection_error'));
                    next({err: this.errorMessage});
                } else {
                    this.accounts.forEach(el => {
                        if (el.address === opts.address
                            && el.network === opts.network
                            && el.symbol === opts.symbol) {
                            el.balance = bs.balance ? bs.balance : '';
                        }
                    });
                    next(bs);
                }
            });
        }
    }
    getAccountTransactions(params: any, next: any) {
        const opts: any = {};
        opts.address = params.address || null;
        opts.symbol = params.symbol || null;
        opts.network = params.network || null;
        this.infoInit();
        if (!this._verifyAccountParams(opts)) {
            next({err: this.errorMessage});
        } else {
            opts.method = 'getTransactions';
            this._getApi(opts, txs => {
                if (!txs) {
                    this.error(this.trans.translate('err.server_connection_error'));
                    next({err: this.errorMessage});
                } else {
                    const transactions = (txs.out && txs.in) ? txs.out.map(e => {
                        return {
                            hash: e.hash,
                            short_hash: e.hash.toString().slice(0, 16) + '...',
                            time: new Date(e.timestamp * 1000),
                            value: '-' + e.value
                        };
                    }).concat(txs.in.map(e => {
                        return {
                            hash: e.hash,
                            short_hash: e.hash.toString().slice(0, 8) + '...',
                            time: new Date(e.timestamp),
                            value: '+' + e.value
                        };
                    })) : [];
                    this.accounts.forEach(el => {
                        if (el.address === opts.address
                            && el.network === opts.network
                            && el.symbol === opts.symbol) {
                            el.transactions = transactions.sort((a, b) => a.time > b.time);
                        }
                    });
                    next(transactions.sort((a, b) => a.time > b.time));
            }
            });
        }
    }
    getTx(params: any, next: any) {
        params.hash = params.hash || null;
        params.symbol = params.symbol || null;
        params.network = params.network || null;
        this.infoInit();
        if (!this._verifyAccountParams(params)) {
            next({err: this.errorMessage});
        } else {
            params.method = 'getTransaction';
            this._getApi(params, tx => {
                next(tx);
            });
        }
    }
    createTx(params: any, next: any) {
        this.infoInit();
        this._getApi({
            method: 'getTransactionCount',
            symbol: params.symbol,
            network: params.network,
            address: params.sender
    }, txCount => {
            if (!txCount) {
                next({err: this.trans.translate('err.server_connection_error')});
            } else {
                this._getApi({
                    method: 'getPriceLimit',
                    symbol: params.symbol,
                    network: params.network
                }, gasPL => {
                    if (!gasPL) {
                        next({err: this.trans.translate('err.server_connection_error')});
                    } else {
                        const txParams: any = {
                            nonce: '0x' + Number(txCount.TransationCount).toString(16),
                            gasPrice: EthUtils.intToHex(gasPL.gasPrice),
                            gasLimit: EthUtils.intToHex(params.gas),
                            to: params.receiver,
                            value: '0x' + (params.ammount * 1e18).toString(16),
                            data: '',
                            chainId: params.network === 'livenet' ? 1 : 3
                            };
                        try {
                            const tx = new EthTx(txParams);
                            console.dir(tx);
                            const key = this.accounts
                                .filter(el => el.address === params.sender
                                && el.symbol === params.symbol
                                && el.network === params.network)[0].key;
                            tx.sign(key);
                            console.dir(tx.nonce.toString('hex'));
                            console.dir(tx.from.toString('hex'));
                            console.dir(tx.to.toString('hex'));
                            console.dir(tx.gasPrice.toString('hex'));
                            console.dir(tx.gasLimit.toString('hex'));
                            console.dir(tx.data.toString('hex'));
                            console.log('Value ' + tx.value.toString('hex'));
                            const raw = tx.serialize();
                            next({tx: '0x' + raw.toString('hex')});
                        } catch (e) {
                            console.log(e.message);
                            next({err: this.trans.translate('err.raw_tx_error')});
                        }
                    }
                });
            }
        });
        return '';
    }
    sendTx(params: any, next: any) {
        this._getApi({
            method: 'sendRawTransaction',
            symbol: params.symbol,
            network: params.network,
            hex: params.hex
        }, hash => {console.dir(hash);
            if (hash.err || hash.hash.hs.err) {
                next({err: hash.err});
            } else {
                next({hash: hash.hash.hs.hash});
            }
        });
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
                           response.address);
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
                                response.address);
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
        const opts: any = {};
        opts.symbol = params.symbol || null;
        opts.keyFile = params.keyFile || null;
        opts.passphrase = params.passphrase || null;
        opts.network = params.network || null;
        console.dir(opts);
        console.log('Step 6');
        this.infoInit();
         if (!this._verifyAccountParams(opts)) {
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
                                    next(response);
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
                                        ' ' + response.address);
                                    next(response);
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
                            || params[ind].length < 6 || params[ind].length > 256) {
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
                    case 'hash':
                        if ( typeof params[ind] !== 'string') {
                            this.error(this.trans.translate('err.wrong_hash'));
                            console.log('step 20');
                            return false;
                        }
                        break;
                    case 'time':
                        if ( typeof params[ind] !== 'object') {
                            this.error(this.trans.translate('err.wrong_hash'));
                            console.log('step 21');
                            return false;
                        }
                        break;
                    case 'value':
                        if ( typeof params[ind] !== 'string') {
                            this.error(this.trans.translate('err.wrong_hash'));
                            console.log('step 22');
                            return false;
                        }
                        break;
                    case 'short_hash':
                        if ( typeof params[ind] !== 'string') {
                            this.error(this.trans.translate('err.wrong_hash'));
                            console.log('step 20');
                            return false;
                        }
                        break;
                    case '_pKey':
                        if ( typeof params[ind] !== 'string'
                            || params[ind].length < 32 || params[ind].length > 256) {
                            this.error(this.trans.translate('err.bad_key'));
                            console.log('step 18');
                            return false;
                        }
                        break;
                    case 'key':
                        if ( 0 ) {
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
                    case 'transactions':
                        if ( typeof params[ind] !== 'object') {
                            this.error(this.trans.translate('err.bad_transactions_object'));
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
        }
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
                            account.key = pKey; // .toString('hex');
                            account.network = params.network;
                            account.symbol = params.symbol;
                            account.transactions = [];
                            account.balance = '';
                            this.accounts.push(account);
                            callback(account);
                        } else {
                            this.error(this.trans.translate('err.eth_account_open_error'));
                            callback({err: this.errorMessage});
                        }
                    });
                } catch (e) {
                    this.error(e.message);
                    callback({err: this.errorMessage});
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
                account.key = dk; // .toString('hex');
                account.network = params.network;
                account.symbol = params.symbol;
                account.transactions = [];
                account.balance = '';
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
    _getApi(opts: any, next: any) {
        const self = this;
        opts.url = 'http://194.71.227.15/api/v4.0/';
        opts.headers = {
            headers: new HttpHeaders()
                .set('Content-Type', 'application/json')
        };
        if (!opts.method || !opts.symbol || !opts.network) {
            next(null);
        } else {
            try {
                switch (opts.method) {
                    case 'getBalance': {
                        self.http.get(opts.url + opts.symbol + '/getBalance/' + opts.address,
                            opts)
                            .subscribe(response => {console.dir(response);
                                next(response ? response : null);
                            });
                        break;
                    }
                    case 'getTransactions': {
                        console.log('step11');
                        self.http.get(opts.url + opts.symbol +
                            '/getTransactionsList/' + opts.address,
                            opts)
                            .subscribe(response => {console.dir(response);
                                next(response ? response : null);
                            });
                        break;
                    }
                    case 'getTransaction': {
                        self.http.get(opts.url + opts.symbol +
                            '/getTransactionByHash/' + opts.hash,
                            opts)
                            .subscribe(response => {console.dir(response);
                                next(response ? response : null);
                            });
                        break;
                    }
                    case 'getPriceLimit': {
                        self.http.get(opts.url + opts.symbol + '/getPriceLimit',
                            opts)
                            .subscribe(response => {console.dir(response);
                                next(response ? response : null);
                            });
                        break;
                    }
                    case 'sendRawTransaction': {
                        self.http.get(opts.url + opts.symbol + '/sendRawTransaction/' +
                            opts.hex,
                            opts)
                            .subscribe(response => { console.dir(response);
                                next({hash: response ? response : null, err: null});
                            }, err => {
                                if (err.error && err.error.hs && err.error.hs.err) {
                                    next({hash: null, err: err.error.hs.err});
                                }
                            });
                        break;
                    }
                    case 'getTransactionCount': {
                        console.log(opts.url + opts.symbol + '/getTransactionCount/' +
                            opts.address);
                        self.http.get(opts.url + opts.symbol + '/getTransactionCount/' +
                            opts.address,
                            opts)
                            .subscribe(response => {console.dir(response);
                                next(response ? response : null);
                            });
                        break;
                    }
                    default: next(null);
                }
            } catch (err) {
                this.error(err.message);
                next(null);
            }
        }
    }
}
