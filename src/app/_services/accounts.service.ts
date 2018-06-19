import { Injectable } from '@angular/core';
import { Account } from '../lib/account';
import { config } from '../config';
import {TranslatorService} from '../translator';
import * as Keythe from '../../../node_modules/keythereum';
import * as EthTx from '../../../node_modules/ethereumjs-tx';
import * as EthUtils from 'ethjs-util';
import {Buffer} from 'buffer';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import * as Bitcore from 'bitcore-lib';
import * as Litecore from 'litecore-lib';
import * as Zeccore from 'zcash-bitcore-lib';
import * as crypto from 'crypto-browserify';
import * as blib from 'bitcoinjs-lib';
import * as bitcash from 'bitcoincashjs';
import Utils from '../lib/utils';
import AccountETH from '../lib/accountETH';
import AccountBTC from '../lib/accountBTC';

@Injectable()
export class AccountsService {
    private _config: any;
    public currentAccount: any;
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
        if (this._config.dev.mode) {
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
                transactions: el.transactions,
                hide: el.hide,
                open: el.open
            };
        });
    }
    isOpen(opts: any): any {
        const acc = this.accounts.
        filter(el => el.address === opts.address
            && el.network === opts.network
            && el.symbol === opts.symbol);
        return acc.length ? acc[0] : null;
    }
    getAccountBalance(params: any) {
        const self = this;
        const opts: any = {};
        opts.address = params.address || null;
        opts.symbol = params.symbol || null;
        opts.network = params.network || null;
        opts.method = 'getBalance';
        self.infoInit();
        return new Promise((resolve, reject) => {
            Utils.getApi({
                method: 'getBalance',
                symbol: opts.symbol,
                address: opts.address
            }, this.http)
                .then(bs => {
                    const bal = bs.data || null;
                    if (!bal) {
                        reject(self.trans
                            .translate('err.server_connection_error'));
                    }
                    this.accounts.forEach(el => {
                        if (el.address === opts.address
                            && el.network === opts.network
                            && el.symbol === opts.symbol) {
                            el.balance = bal.balance ? bal.balance : '';
                            }
                        });
                    return resolve(bal);
                    })
                .catch(err => {
                    return reject(err);
                });
        });
    }
    getAccountTransactions(params: any) {
        const self = this;
        const opts: any = {};
        opts.address = params.address || null;
        opts.symbol = params.symbol || null;
        opts.network = params.network || null;
        return new Promise((resolve, reject) => {
            Utils.getApi({
                        method: 'getTransactions',
                        symbol: opts.symbol,
                        address: opts.address
                    }, this.http)
                .then(data => {
                    const txs = data.data || null;
                    if (!txs) { reject(this.trans
                        .translate('err.server_response_error')); }
                    if (opts.symbol === 'ETH') {
                        const transactions = (txs['out'] && txs['in']) ? txs['out'].map(e => {
                            return {
                                hash: e.hash,
                                time: new Date(e.timestamp * 1000),
                                value: '-' + e.value.toString()
                            };
                        }).concat(txs['in'].map(e => {
                            return {
                                hash: e.hash,
                                time: new Date(e.timestamp * 1000),
                                value: '+' + e.value.toString()
                            };
                        })) : [];
                        this.accounts.forEach(el => {
                            if (el.address === opts.address
                                && el.network === opts.network
                                && el.symbol === opts.symbol) {
                                el.transactions = transactions
                                    .sort((a, b) => b.time.getTime() - a.time.getTime());
                            }
                        });
                        return resolve(transactions.sort((a, b) =>
                            b.time.getTime() - a.time.getTime()));
                    }
                    else {
                        if (!txs) { reject(this.trans
                            .translate('err.server_response_error')); }
                            try {
                                // const trx = JSON.parse(txs.txs);
                                // const trans = trx.txs;
                                const trans = Array (txs); console.dir(txs);
                                const transactions = trans.map(e => {
                                    return {
                                        blockheight: e['blockheight'],
                                        id: e['txid'],
                                        time: new Date(e['timestamp'] * 1000),
                                        vin: e['vin'] ? e['vin'].map(el => {
                                            return {
                                                adress: 'addr',
                                                value: 0,
                                                txid: el.txid
                                            };
                                        }) : [{
                                            adress: 'addr',
                                            value: 0,
                                            txid: 'no tx id'
                                        }],
                                        vout: e['vout'] ? e['vout'].map(el => {
                                            return {
                                                scriptPubKey : {addresses: el.scriptPubKey.addresses},
                                                value: el.value
                                            };
                                        }) : [{
                                            scriptPubKey : {addresses: ['no addresses']},
                                            value: 0
                                        }]
                                    };
                                });
                                const toTxs = transactions.sort((a, b) =>
                                    b.time.getTime() - a.time.getTime());
                                self.accounts.forEach(el => {
                                    if (el.address === opts.address
                                        && el.network === opts.network
                                        && el.symbol === opts.symbol) {
                                        el.transactions = toTxs;
                                    }
                                });
                                return resolve(toTxs);
                            } catch (err) {console.dir(err);
                            return reject(this.trans
                                .translate('err.server_response_error')); }
                    }
                })
                .catch(err => {
                    return reject(err);
                });
        });
    }
    getTx(params: any) {
        const self = this;
        return new Promise( (resolve, reject) => {
            const opts: any = {};
            if (params.hash) { opts.hash = params.hash; }
            if (params.id) { opts.id = params.id; }
            opts.symbol = params.symbol || null;
            opts.network = params.network || null;
            opts.method = 'getTransaction';
            self._verifyAccountParams(opts)
                .then(() => self._getApi_P(opts))
                .then(tx => resolve(tx))
                .catch(err => reject(err));
        });
    }
    createTx(params: any, next: any) {
        this.infoInit();
        switch (params.symbol) {
            case 'ETH':
                this._createETHRawTransaction(params)
                    .then(rawTx => {
                        next({tx: rawTx});
                    })
                    .catch(error => {
                        next({err: error});
                    });
                break;
            case 'BTC':
                this._createBTCRawTransaction(params)
                    .then(rawTx => {
                        next({tx: rawTx});
                    })
                    .catch(error => {
                        next({err: error});
                    });
                break;
            case 'BTG':
                this._getApi({
                    method: 'getUTXOS',
                    symbol: params.symbol,
                    network: params.network,
                    address: params.sender
                }, ut => {
                    if (!ut) {
                        next({err: this.trans.translate('err.server_connection_error')});
                    } else {
                        // try {
                        console.dir(params);
                        console.dir(ut);
                        const tx = Bitcore.Transaction();
                        tx.from(ut);
                        tx.to(params.receiver, params.amount * 1e8);
                        tx.change(params.change);
                        console.dir(tx);
                        const key = this.accounts
                            .filter(el => el.address === params.sender
                                && el.symbol === params.symbol
                                && el.network === params.network)[0].key;
                        tx.sign(key); console.dir(key);
                        console.log(tx.serialize());
                        next({tx: tx.serialize()});
                        /*} catch (e) {
                            console.log(e.message);
                            next({err: this.trans.translate('err.raw_tx_error')});
                        }*/
                    }
                });
                break;
            case 'BCH':
                this._getApi({
                    method: 'getUTXOS',
                    symbol: params.symbol,
                    network: params.network,
                    address: params.sender
                }, ut => {
                    /*if (!ut || !ut.utxos) {
                        next({err: this.trans.translate('err.server_connection_error')});
                    } else
 */{
                         try {
                        console.dir(ut);
                        const tx = new bitcash.Transaction();
                        tx.from(ut);
                        /*const from = JSON.parse('[{"address":"13JUK6jdtshv6evj8giRaDgR5dw4WQM5jG","txid":"87329fae502377053b4d1f24daad70a94cf21cc4aa2f084ea584fe51104a4060","vout":1,"scriptPubKey":"76a914193e1f32ccc25ee0f225243492e24ab19e8ceacb88ac","amount":0.0128777}]');
                        tx.from(from);*/
                        tx.to(params.receiver, params.amount * 1e8);
                        tx.change(params.change);
                        //tx.change('1KQ4GHZZkTavf1uZ9d7jT8wcpcF8o14FLE');
                        console.dir(tx);
                        const key = this.accounts
                            .filter(el => el.address === params.sender
                                && el.symbol === params.symbol
                                && el.network === params.network)[0].key;
                        tx.sign(new bitcash.PrivateKey(key));
                        console.dir(tx)//(tx.serialize());
                        next({tx: tx});
                        } catch (e) {
                            console.log(e.message);
                            next({err: this.trans.translate('err.raw_tx_error')});
                        }
                    }
                });
                break;
            case 'LTC':
                this._getApi({
                    method: 'getUTXOS',
                    symbol: params.symbol,
                    network: params.network,
                    address: params.sender
                }, ut => {
                    if (!ut || !ut.utxos) {
                        next({err: this.trans.translate('err.server_connection_error')});
                    } else {
                        // try {
                        console.dir(params);
                        const tx = Bitcore.Transaction();
                        tx.from(ut.utxos);
                        tx.to(params.receiver, params.amount * 1e8);
                        tx.change(params.change);
                        console.dir(tx);
                        const key = this.accounts
                            .filter(el => el.address === params.sender
                                && el.symbol === params.symbol
                                && el.network === params.network)[0].key;
                        tx.sign(key);
                        console.log(tx.serialize());
                        next({tx: tx.serialize()});
                        /*} catch (e) {
                            console.log(e.message);
                            next({err: this.trans.translate('err.raw_tx_error')});
                        }*/
                    }
                });
                break;
            default:
                next({err: this.trans.translate('err.raw_tx_error')});
                break;
        }
        return '';
    }
    sendTx(params: any, next: any) {
        Utils.getApi({
            method: 'sendRawTransaction',
            symbol: params.symbol,
            network: params.network,
            hex: params.hex
        }, this.http)
        .then(res => {
            if (params.symbol === 'ETH') {
                if (res.err) {
                    next({err: res.err});
                } else {
                    next({hash: res['data']['hash']});
                }
            } else {
                if (res.err) {
                    next({err: res.err});
                } else {
                    next({txid: res.txid});
                }
            }
        }).catch(err => {
            next({err: err.message});
        });
    }
    createAccount(params: any) {
        const self = this;
        params.passphrase = params.passphrase || null;
        params.symbol = params.symbol || null;
        params.network = params.network || null;
        return new Promise((resolve, reject) => {
            const verify = Utils.verifyParams(params);
            if (!verify['status']) {
                return reject(this.trans.translate(verify['error'] !== 'params' ?
                    'err.wrong_field_' + verify['error']
                    : 'err.wrong_params'));
            }
            this._createAccount(params)
                .then(account => {
                    if (!account) {
                        return reject(this
                            .trans.translate('err.account_create_error'));
                    } else {
                        this.accounts.push(account);
                        this.currentAccount = account;
                        const fileName = Utils.keyFileName(this.currentAccount.address);
                        if (!fileName['status']) {
                            console.log(fileName['error']);
                            return reject(this
                                .trans.translate('err.account_create_error'));
                        } else {
                            const download = Utils
                                .uploadFile(this.currentAccount.keyObject, fileName['fileName']);
                            if (!download['status']) {
                                console.log(download['error']);
                                return reject(this
                                    .trans.translate('err.account_create_error'));
                            } else {
                                return resolve(true);
                            }
                        }
                    }
                })
                .catch(err => {
                    return reject(err);
                });
        });
    }
    openAccount(params: any) {
        const self = this,
        opts: any = {};
        opts.symbol = params.symbol || null;
        opts.keyFile = params.keyFile || null;
        opts.passphrase = params.passphrase || null;
        opts.network = params.network || null;
        return new Promise((resolve, reject) => {
            const verify = Utils.verifyParams(opts);
            if (! verify['status']) {
                return reject(verify);
            } else {
                let newAccount: any = {};
                if (opts.symbol === 'ETH') {
                    newAccount = new AccountETH(opts.symbol, opts.network);
                }
                if (opts.symbol === 'BTC') {
                    newAccount = new AccountBTC(opts.symbol, opts.network);
                }
                Utils.readKeyFile(opts.keyFile)
                    .then(keyFile => {
                        if (!keyFile) {
                            return reject('err.account_open_error');
                        } else {
                            return newAccount.recoveryFromKeyObject(opts.passphrase, keyFile);
                        }
                    })
                .then(() => {
                    self.accounts.push(newAccount);
                    self.currentAccount = newAccount;
                    return resolve(self.currentAccount);
                })
                .catch(err => {console.dir(err);
                    return reject(err.message);
                });
            }
        });
    }
    getGas() {
        return new Promise((resolve, reject) => {
            Utils.getApi({
                method: 'getPriceLimit',
                symbol: 'ETH',
                network: 'ropsten'
            }, this.http).then(data => {
                const gas = data.data || null;
                if (!gas || !gas.gasLimit) {
                    return reject(this.trans.translate('err.server_connection_error'));
                } else {
                    return resolve(gas.gasLimit);
                }
            })
                .catch(error => {
                    return reject(error);
                });
        });
    }
    async refreshAccount() {
        const params = {
            method: 'getBalance',
            address: this.currentAccount.address,
            network: this.currentAccount.network,
            symbol: this.currentAccount.code
        };
        const verify = Utils.verifyParams(params);
        if (!verify['status']) {
            throw new Error(verify['error']);
        } else {
            const balance = await Utils.getApi(params, this.http);
            this.currentAccount.balance = balance['data']['balance']
                / this.currentAccount.decimals;
            params.method = 'getTransactions';
            const txs = await Utils.getApi(params, this.http);
            if (this.currentAccount.code === 'ETH') {
                this.currentAccount.transactions = txs['data']['in']
                    .concat(txs['data']['out'])
                    .concat(txs['data']['pending_in'])
                    .concat(txs['data']['pending_out']);
            }
            if (this.currentAccount.code === 'BTC') {
                this.currentAccount.transactions = txs['data']['txs'];
            }
            console.dir(this.currentAccount);
            return true;
        }
    }
    closeAcount(address: string, network: string): boolean {
        const acc = this.accounts.
        filter(el => el.address === address && el.network === network);
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
    _verifyAccountParams(params: any) {
        return new Promise((resolve, reject) => {
            if (typeof params !== 'object') {
                reject(this.trans.translate('err.wrong_account_params_object'));
            } else {
                for (const ind in params) {
                    if (!params[ind]) {
                        reject(this.trans.translate('err.wrong_account_params_object'));
                    } else {
                        switch (ind) {
                            case 'symbol':
                                if ( typeof params[ind] !== 'string'
                                    || !this._config.symbols.filter(el => {
                                        return el === params[ind];
                                    }).length) {
                                    reject(this.trans.translate('err.wrong_symbol'));
                                }
                                break;
                            case 'passphrase':
                                if ( typeof params[ind] !== 'string'
                                    || params[ind].length < 6 || params[ind].length > 256) {
                                    reject(this.trans.translate('err.wrong_passphrase'));
                                }
                                break;
                            case 'address':
                                if ( typeof params[ind] !== 'string'
                                    || params[ind].length < 32 || params[ind].length > 64) {
                                    reject(this.trans.translate('err.wrong_address'));
                                }
                                break;
                            case 'hash':
                                if ( typeof params[ind] !== 'string') {
                                    reject(this.trans.translate('err.wrong_hash'));
                                }
                                break;
                            case 'id':
                                if ( typeof params[ind] !== 'string') {
                                    reject(this.trans.translate('err.wrong_id'));
                                }
                                break;
                            case 'time':
                                if ( typeof params[ind] !== 'object') {
                                    reject(this.trans.translate('err.wrong_hash'));
                                }
                                break;
                            case 'value':
                                if ( typeof params[ind] !== 'string') {
                                    reject(this.trans.translate('err.wrong_hash'));
                                }
                                break;
                            case 'short_hash':
                                if ( typeof params[ind] !== 'string') {
                                    reject(this.trans.translate('err.wrong_hash'));
                                }
                                break;
                            case '_pKey':
                                if ( typeof params[ind] !== 'string'
                                    || params[ind].length < 32 || params[ind].length > 256) {
                                    reject(this.trans.translate('err.bad_key'));
                                }
                                break;
                            case 'key':
                                break;
                            case 'keyFile':
                                if ( typeof params[ind] !== 'object') {
                                    reject(this.trans.translate('err.bad_key_file'));
                                }
                                break;
                            case 'transactions':
                                if ( typeof params[ind] !== 'object') {
                                    reject(this.trans.translate('err.bad_transactions_object'));
                                }
                                break;
                            case 'network':
                                if ( typeof params[ind] !== 'string'
                                    || !this._config.networks.filter(el => {
                                        return el === params[ind];
                                    }).length) {
                                    reject(this.trans.translate('err.bad_network'));
                                }
                                break;
                            case 'method':
                                if ( typeof params[ind] !== 'string') {
                                    reject(this.trans.translate('err.wrong_method'));
                                }
                                break;
                            default: {
                                reject(this.trans.translate(
                                    'err.wrong_account_params_object_field') + ' ' + ind);
                            }
                        }
                    }
                }
                resolve(true);
            }
        });
    }
    _openETHAccount(params: any) {
        return new Promise((resolve, reject) => {
            try {
                 Utils.readKeyFile(params.keyFile)
                     .then(keyFile => {
                         return this.currentAccount
                             .recoveryFromKeyObject(params['passphrase'], keyFile);
                     })
                     .then(rec => {
                         if (!rec) {
                             return reject('err.account_recovery_error');
                         } else {
                             return resolve(true);
                         }
                     })
                     .catch(err => {
                         return reject(err.message);
                     });
            } catch (err) { reject(err.message); }
        });
    }
    _openBTCAccount(params: any) {
        return new Promise((resolve, reject) => {
            const file = new FileReader();
            try {
                file.readAsText(params.keyFile);
                file.onload = (event: any) => {
                    try {
                        const keyFile: any = JSON.parse(event.target.result);
                        console.dir(keyFile);
                        let dKey, decifer: any = {};
                        decifer = crypto.createDecipher(
                                keyFile.calg,
                                params.passphrase);
                        dKey = decifer.update(keyFile.cifertext, 'hex', 'utf8');
                        dKey += decifer.final('utf8');
                        const pKey = Bitcore.PrivateKey.fromWIF(dKey);
                        const account = new Account();
                        account.address = keyFile.address;
                        account.key = pKey;
                        account.network = params.network;
                        account.symbol = params.symbol;
                        account.transactions = [];
                        account.balance = '';
                        account.unlock = true;
                        account.open = false;
                        account.hide = true;
                        account.refresh = false;
                        this.accounts.push(account);
                        resolve(account);
                    } catch (err) {
                        reject(err.message);
                    }
                };
            } catch (err) {
                reject(err.message);
            }
        });
    }
    _openBCHAccount(params: any) {
        return new Promise((resolve, reject) => {
            const file = new FileReader();
            try {
                file.readAsText(params.keyFile);
                file.onload = (event: any) => {
                    try {
                        const keyFile: any = JSON.parse(event.target.result);
                        console.dir(keyFile);
                        let dKey, decifer: any = {};
                        decifer = crypto.createDecipher(
                            keyFile.calg,
                            params.passphrase);
                        dKey = decifer.update(keyFile.cifertext, 'hex', 'utf8');
                        dKey += decifer.final('utf8'); console.log(dKey);
                        const pKey = dKey;//Bitcore.PrivateKey.fromWIF(dKey);
                        const account = new Account();
                        account.address = keyFile.address;
                        account.key = pKey;
                        account.network = params.network;
                        account.symbol = params.symbol;
                        account.transactions = [];
                        account.balance = '';
                        account.unlock = true;
                        account.open = false;
                        account.hide = true;
                        account.refresh = false;
                        this.accounts.push(account);
                        resolve(account);
                    } catch (err) {
                        reject(err.message);
                    }
                };
            } catch (err) {
                reject(err.message);
            }
        });
    }
    _openBTGAccount(params: any) {
        return new Promise((resolve, reject) => {
            const file = new FileReader();
            try {
                file.readAsText(params.keyFile);
                file.onload = (event: any) => {
                    try {
                        const keyFile: any = JSON.parse(event.target.result);
                        console.dir(keyFile);
                        let dKey, decifer: any = {};
                        /*decifer = crypto.createDecipher(
                            keyFile.calg,
                            params.passphrase);
                        dKey = decifer.update(keyFile.cifertext, 'hex', 'utf8');
                        dKey += decifer.final('utf8');*/
                        const pKey = keyFile.cifertext; console.log(pKey); // blib.ECPair.fromWIF(dKey);
                        const account = new Account();
                        account.address = keyFile.address;
                        account.key = pKey;
                        account.network = params.network;
                        account.symbol = params.symbol;
                        account.transactions = [];
                        account.balance = '';
                        account.unlock = true;
                        account.open = false;
                        account.hide = true;
                        account.refresh = false;
                        this.accounts.push(account);
                        resolve(account);
                    } catch (err) {
                        reject(err.message);
                    }
                };
            } catch (err) {
                reject(err.message);
            }
        });
    }
    _openLTCAccount(params: any) {
        return new Promise((resolve, reject) => {
            const file = new FileReader();
            try {
                file.readAsText(params.keyFile);
                file.onload = (event: any) => {
                    try {
                        const keyFile: any = JSON.parse(event.target.result);
                        console.dir(keyFile);
                        let dKey, decifer: any = {};
                        decifer = crypto.createDecipher(
                            keyFile.calg,
                            params.passphrase);
                        dKey = decifer.update(keyFile.cifertext, 'hex', 'utf8');
                        dKey += decifer.final('utf8'); console.log(dKey);
                        const pKey = Litecore.PrivateKey.fromWIF(dKey);
                        const account = new Account();
                        account.address = keyFile.address;
                        account.key = pKey; console.dir(pKey);
                        account.network = params.network;
                        account.symbol = params.symbol;
                        account.transactions = [];
                        account.balance = '';
                        account.unlock = true;
                        account.open = false;
                        account.hide = true;
                        account.refresh = false;
                        this.accounts.push(account);
                        resolve(account);
                    } catch (err) {console.dir(err);
                        reject(err.message);
                    }
                };
            } catch (err) {
                reject(err.message);
            }
        });
    }
    _openZECAccount(params: any) {
        return new Promise((resolve, reject) => {
            const file = new FileReader();
            try {
                file.readAsText(params.keyFile);
                file.onload = (event: any) => {
                    try {
                        const keyFile: any = JSON.parse(event.target.result);
                        console.dir(keyFile);
                        /*let dKey, decifer: any = {};
                        decifer = crypto.createDecipher(
                            keyFile.calg,
                            params.passphrase);
                        dKey = decifer.update(keyFile.cifertext, 'hex', 'utf8');
                        dKey += decifer.final('utf8');*/
                        const pKey = keyFile.cifertext; // Zeccore.PrivateKey.fromWIF(dKey);
                        const account = new Account(); console.log(pKey);
                        account.address = keyFile.address;
                        account.key = pKey;
                        account.network = params.network;
                        account.symbol = params.symbol;
                        account.transactions = [];
                        account.balance = '';
                        account.unlock = true;
                        account.open = false;
                        account.hide = true;
                        account.refresh = false;
                        this.accounts.push(account);
                        resolve(account);
                    } catch (err) {
                        reject(err.message);
                    }
                };
            } catch (err) {
                reject(err.message);
            }
        });
    }
    async _createAccount(params: any) {
        let account: any = {};
        if (params.symbol === 'ETH') {
            account = new AccountETH(params['symbol'], params['network']);
        }
        if (params.symbol === 'BTC') {
            account = new AccountBTC(params['symbol'], params['network']);
        }
        await account.generateKeys(params['passphrase']);
        return account;
    }
    _createBTCAccount(params: any) {
        const self = this;
        return new Promise((resolve, reject) => {
            try {
                const pkey = new Bitcore.PrivateKey(params.network),
                    key = pkey.toWIF(),
                    cifer = crypto.createCipher('aes256', params.passphrase);
                let cifertext = cifer.update(Buffer.from(key),
                    'utf8', 'hex');
                cifertext += cifer.final('hex');
                const keyFile = {
                    address: pkey.toAddress().toString(),
                    calg: 'aes256',
                    cifertext: cifertext
                };
                const blob = new Blob([JSON.stringify(keyFile)],
                    {type: 'text/json'});
                const e = document.createEvent('MouseEvent');
                const a = document.createElement('a');
                a.download = self._keyFileName(keyFile.address);
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href]
                    .join(':');
                e.initMouseEvent('click', true,
                    false, window,
                    0, 0, 0,
                    0, 0, false,
                    false, false, false,
                    0, null);
                a.dispatchEvent(e);
                const account = new Account();
                account.address = keyFile.address;
                account.key = pkey;
                account.network = params.network;
                account.symbol = params.symbol;
                account.transactions = [];
                account.balance = '';
                account.unlock = true;
                account.open = false;
                account.hide = true;
                account.refresh = false;
                self.accounts.push(account);
                resolve(account);
            } catch (e) {
                reject(e.message);
            }
        });
    }
    _createBCHAccount(params: any) {
        const self = this;
        return new Promise((resolve, reject) => {
            try {
                const pkey = new Bitcore.PrivateKey(params.network),
                    key = pkey.toWIF(),
                    cifer = crypto.createCipher('aes256', params.passphrase);
                let cifertext = cifer.update(Buffer.from(key),
                    'utf8', 'hex');
                cifertext += cifer.final('hex');
                const keyFile = {
                    address: pkey.toAddress().toString(),
                    calg: 'aes256',
                    cifertext: cifertext
                };
                const blob = new Blob([JSON.stringify(keyFile)],
                    {type: 'text/json'});
                const e = document.createEvent('MouseEvent');
                const a = document.createElement('a');
                a.download = self._keyFileName(keyFile.address);
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href]
                    .join(':');
                e.initMouseEvent('click', true,
                    false, window,
                    0, 0, 0,
                    0, 0, false,
                    false, false, false,
                    0, null);
                a.dispatchEvent(e);
                const account = new Account();
                account.address = keyFile.address;
                account.key = pkey;
                account.network = params.network;
                account.symbol = params.symbol;
                account.transactions = [];
                account.balance = '';
                account.unlock = true;
                account.open = false;
                account.hide = true;
                account.refresh = false;
                self.accounts.push(account);
                resolve(account);
            } catch (e) {
                reject(e.message);
            }
        });
    }
    _createBTGAccount(params: any) {
        const self = this;
        return new Promise((resolve, reject) => {
            try {
                /*const key = Bitcore.crypto.BN.fromBuffer(
                    Bitcore.crypto.Hash.sha256(
                        Buffer.from(params.passphrase)
                    )
                );*/
                const key = blib.ECPair.makeRandom({
                    rng: () => Buffer.from(crypto.randomBytes(32)),
                    network: {
                        messagePrefix: '\x1DBitcoin Gold Signed Message:\n',
                        bech32: 'btg',
                        bip32: {
                            public: 0x0488b21e,
                            private: 0x0488ade4
                        },
                        pubKeyHash: 0x26,
                        scriptHash: 0x17,
                        wif: 0x80
                    }
                });
                const address = key.getAddress(); // new Bitcore.PrivateKey(key).toAddress(); console.log(address);
                const cifer = crypto.createCipher('aes256', params.passphrase);
                let cifertext = cifer.update(Buffer.from(address.toString()),
                    'utf8', 'hex');
                cifertext += cifer.final('hex');
                const keyFile = {
                    address: address.toString(), // key.getAddress(), // pkey.toAddress().toString(),
                    calg: 'aes256',
                    cifertext: key.toWIF() // cifertext
                };
                const blob = new Blob([JSON.stringify(keyFile)],
                    {type: 'text/json'});
                const e = document.createEvent('MouseEvent');
                const a = document.createElement('a');
                a.download = self._keyFileName(keyFile.address);
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href]
                    .join(':');
                e.initMouseEvent('click', true,
                    false, window,
                    0, 0, 0,
                    0, 0, false,
                    false, false, false,
                    0, null);
                a.dispatchEvent(e);
                const account = new Account();
                account.address = keyFile.address;
                account.key = key.toString(); // Bitcore.PrivateKey(key).toString();
                account.network = params.network;
                account.symbol = params.symbol;
                account.transactions = [];
                account.balance = '';
                account.unlock = true;
                account.open = false;
                account.hide = true;
                account.refresh = false;
                self.accounts.push(account);
                resolve(account);
            } catch (e) {console.log(e);
                reject(e.message);
            }
        });
    }
    _createLTCAccount(params: any) {
        const self = this;
        return new Promise((resolve, reject) => {
            try {
                const pkey = new Litecore.PrivateKey(params.network),
                    key = pkey.toWIF();
                const cifer = crypto.createCipher('aes256', params.passphrase);
                let cifertext = cifer.update(Buffer.from(key),
                    'utf8', 'hex');
                cifertext += cifer.final('hex');
                const keyFile = {
                    address: pkey.toAddress().toString(),
                    calg: 'aes256',
                    cifertext: cifertext
                };
                const blob = new Blob([JSON.stringify(keyFile)],
                    {type: 'text/json'});
                const e = document.createEvent('MouseEvent');
                const a = document.createElement('a');
                a.download = self._keyFileName(keyFile.address);
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href]
                    .join(':');
                e.initMouseEvent('click', true,
                    false, window,
                    0, 0, 0,
                    0, 0, false,
                    false, false, false,
                    0, null);
                a.dispatchEvent(e);
                const account = new Account();
                account.address = keyFile.address;
                account.key = pkey;
                account.network = params.network;
                account.symbol = params.symbol;
                account.transactions = [];
                account.balance = '';
                account.unlock = true;
                account.open = false;
                account.hide = true;
                account.refresh = false;
                self.accounts.push(account);
                resolve(account);
            } catch (e) {
                reject(e.message);
            }
        });
    }
    _createZECAccount(params: any) {
        const self = this;
        return new Promise((resolve, reject) => {
            try {
                const pkey = new Zeccore.PrivateKey(params.network),
                    key = pkey.toWIF(),
                    cifer = crypto.createCipher('aes256', params.passphrase);
                let cifertext = cifer.update(Buffer.from(key),
                    'utf8', 'hex');
                cifertext += cifer.final('hex');
                const keyFile = {
                    address: pkey.toAddress().toString(),
                    calg: 'aes256',
                    cifertext: cifertext
                };
                const blob = new Blob([JSON.stringify(keyFile)],
                    {type: 'text/json'});
                const e = document.createEvent('MouseEvent');
                const a = document.createElement('a');
                a.download = self._keyFileName(keyFile.address);
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href]
                    .join(':');
                e.initMouseEvent('click', true,
                    false, window,
                    0, 0, 0,
                    0, 0, false,
                    false, false, false,
                    0, null);
                a.dispatchEvent(e);
                const account = new Account();
                account.address = keyFile.address;
                account.key = key.toWIF();
                account.network = params.network;
                account.symbol = params.symbol;
                account.transactions = [];
                account.balance = '';
                account.unlock = true;
                account.open = false;
                account.hide = true;
                account.refresh = false;
                self.accounts.push(account);
                resolve(account);
            } catch (e) {console.dir(e);
                reject(e.message);
            }
        });
    }
    async _createETHRawTransaction(params) {
        const verify = Utils.verifyParams(params);
        if (!verify['status']) {
            throw new Error(verify['error']);
        } else {
            const txCount = await Utils.getApi(
                {
                    method: 'getTransactionCount',
                    address: this.currentAccount.address,
                    network: this.currentAccount.network,
                    symbol: this.currentAccount.code
                },
                this.http
            );
            const gasPriceHex = await Utils.getApi(
                {
                    method: 'getGasPrice',
                    address: this.currentAccount.address,
                    network: this.currentAccount.network,
                    symbol: this.currentAccount.code
                },
                this.http
            );
            params.nonce = Number(txCount['data']);
            params.gasPrice = gasPriceHex['data']['gasPrice'];
            params.gasLimit = params['gasLimit'];
            params.to = params['receiver'];
            params.value = params['amount'];
            // params.chainId = this.currentAccount.chainId;
            return params['contract'] && params['contract'].length > 0
                ? await this.currentAccount.createTokensERC20Transaction(params)
                : await this.currentAccount.createSendMoneyTransaction(params);
        }
    }
    async _createBTCRawTransaction(params) {
        const opts = Object.assign({}, {
            receiver: params['receiver'],
            amount: params['amount'],
            change: params['change'],
            utxo: []
        });
        const verify = Utils.verifyParams(opts);
        if (!verify['status']) {
            throw new Error(verify['error']);
        } else {
            const utxo = await Utils.getApi(
                {
                    method: 'getUTXOS',
                    address: this.currentAccount.address,
                    network: this.currentAccount.network,
                    symbol: this.currentAccount.code
                },
                this.http
            );
            opts.utxo.concat(utxo['data']);
            // params.chainId = this.currentAccount.chainId;
            return await this.currentAccount.createSendMoneyTransaction(opts);
        }
    }
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
        opts.url = this._config.app.apiURL;
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
                        const url = opts.symbol === 'ETH' ? opts.url + opts.symbol +
                            '/getBalance/' + opts.address :
                            opts.url + opts.symbol +
                            '/getBalance/' + opts.address;
                        self.http.get(url,
                            opts)
                            .subscribe(response => {console.dir(response);
                                next(response ? {balance: response['balance']} : null);
                            });
                        break;
                    }
                    case 'getTransactions': {
                        console.log('step11');
                        self.http.get(opts.url + opts.symbol +
                            '/getTxList/' + opts.address,
                            opts)
                            .subscribe(response => {console.dir(response);
                                next(response ? response : null);
                            });
                        break;
                    }
                    case 'getTransaction': {
                        switch (opts.symbol) {
                            case 'ETH':
                                self.http.get(opts.url + opts.symbol +
                                    '/getTransactionByHash/' + opts.hash,
                                    opts)
                                    .subscribe(response => {console.dir(response);
                                        next(response ? response : null);
                                    });
                                break;
                            case 'BTC':
                                self.http.get(opts.url + opts.symbol +
                                    '/getTransactionById/' + opts.id,
                                    opts)
                                    .subscribe(response => {console.dir(response);
                                        next(response ? response : null);
                                    });
                                break;
                            default:
                                next(null);
                                break;
                        }
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
                        if (opts.symbol === 'EHT') {
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
                        } else {
                            self.http.get(opts.url + opts.symbol + '/sendRawTransaction/' +
                                opts.hex,
                                opts)
                                .subscribe(response => { console.dir(response);
                                    next({txid: response ? response : null, err: null});
                                }, err => {
                                    if (err.error && err.error.hs && err.error.hs.err) { // TODO check error response
                                        next({txid: null, err: err.error.hs.err});
                                    }
                                });
                        }
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
                    case 'getUTXOS':
                        console.log(opts.url + opts.symbol + '/UTXOs/' +
                        opts.address);
                        self.http.get(opts.url + opts.symbol + '/getUTXOs/' +
                            opts.address, opts)
                            .subscribe(response => {
                                console.dir(response['utxos']);
                                next(response['utxos']);
                            });
                        break;
                    default: next(null);
                }
            } catch (err) {
                this.error(err.message);
                next(null);
            }
        }
    }
    _getApi_P(opts: any) {
        const self = this;
        opts.url = this._config.app.apiURL;
        opts.headers = {
            headers: new HttpHeaders()
                .append('Content-Type', 'application/json')
        };
        return new Promise((resolve, reject) => {
            if (!opts.method) {reject('Error method.'); }
            if (!opts.symbol) {reject('Error symbol.'); }
            if (!opts.network) {reject('Error network.'); }
            switch (opts.method) {
                case 'getBalance': {
                    const url = opts.url + opts.symbol +
                        '/getBalance/' + opts.address;
                        self.http.get(url, opts)
                            .subscribe(response => {
                                response ?
                                        resolve({balance: response['balance']})
                                    : reject(null);
                                });
                            break;
                        }
                case 'getTransactions': {
                    console.log(opts.url + opts.symbol +
                        (opts.symbol === 'ETH' ? '/getTransactionsList/' : '/getTxList/') + opts.address);
                    self.http.get(opts.url + opts.symbol +
                        (opts.symbol === 'ETH' ? '/getTransactionsList/' : '/getTxList/') + opts.address, opts)
                    .subscribe(response => {console.dir(response);
                    response ? resolve(response)
                        : reject(null);
                        });
                    break;
                    }
                case 'getTransaction': {
                    switch (opts.symbol) {
                        case 'ETH':
                            self.http.get(opts.url + opts.symbol +
                            '/getTransactionByHash/' + opts.hash, opts)
                            .subscribe(response => {console.dir(response);
                                response ? resolve(response)
                                    : reject(null);
                                });
                            break;
                        case 'BTC':
                            self.http.get(opts.url + opts.symbol +
                            '/getTransactionById/' + opts.id, opts)
                            .subscribe(response => {console.dir(response);
                                response ? resolve(response)
                                    : reject(null);
                                });
                            break;
                        default:
                            reject(null);
                            break;
                            }
                            break;
                        }
                case 'getPriceLimit': {
                    self.http.get(opts.url + opts.symbol + '/getPriceLimit', opts)
                    .subscribe(response => {console.dir(response);
                        response ? resolve(response)
                            : reject(null);
                        });
                    break;
                        }
                case 'sendRawTransaction': {
                    if (opts.symbol === 'EHT') {
                        self.http
                            .get(opts.url +
                                    opts.symbol +
                                    '/sendRawTransaction/' +
                                    opts.hex,
                                    opts)
                            .subscribe(response => {
                                resolve({hash: response ? response : null});
                                    },
                                    err => {
                                        if (err.error && err.error.hs && err.error.hs.err) {
                                            reject({err: err.error.hs.err});
                                        } else { reject({err: null}); }
                                    });
                    } else {
                        self.http
                            .get(opts.url +
                                    opts.symbol +
                                    '/sendRawTransaction/' +
                                    opts.hex,
                                    opts)
                            .subscribe(response => { console.dir(response);
                                resolve({txid: response ? response : null});
                                    },
                                    err => {
                                        if (err.error && err.error.hs && err.error.hs.err) { // TODO check error response
                                            reject({ err: err.error.hs.err});
                                        } else { reject({err: null}); }
                                    });
                            }
                            break;
                        }
                case 'getTransactionCount': {
                    console.log(opts.url + opts.symbol + '/getTransactionCount/' +
                                opts.address);
                    self.http
                        .get(opts.url +
                                opts.symbol +
                                '/getTransactionCount/' +
                                opts.address,
                                opts)
                        .subscribe(response => {console.dir(response);
                            response ? resolve(response)
                                : reject(null);
                                });
                            break;
                        }
                case 'getUTXOS':
                    console.log(opts.url + opts.symbol + '/UTXOs/' +
                                opts.address);
                    self.http
                        .get(opts.url +
                                opts.symbol +
                                '/getUTXOs/' +
                                opts.address,
                                opts)
                        .subscribe(response => {console.dir(response);
                            response ? resolve(response)
                                : reject(null);
                                });
                            break;
                default: reject(null);
                    }
        });
    }
}
