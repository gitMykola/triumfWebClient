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
import * as crypto from 'crypto-browserify';

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
            self._verifyAccountParams_P(opts)
                .then(() => this._getApi_P(opts))
                .then(bs => {
                    const bal: any = bs;
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
                    resolve(bal);
                    })
                .catch(err => reject(err));
        });
    }
    getAccountTransactions(params: any) {
        const self = this;
        const opts: any = {};
        opts.address = params.address || null;
        opts.symbol = params.symbol || null;
        opts.network = params.network || null;
        return new Promise((resolve, reject) => {
            this._verifyAccountParams_P(opts)
                .then(() => {
                    opts.method = 'getTransactions';
                    return self._getApi_P(opts);
                })
                .then(res => {
                    const txs: any = res;
                    if (!txs) { reject(this.trans
                        .translate('err.server_response_error')); }
                    if (opts.symbol === 'ETH') {
                        const transactions = (txs.out && txs.in) ? txs.out.map(e => {
                            return {
                                hash: e.hash,
                                time: new Date(e.timestamp * 1000),
                                value: '-' + e.value.toString()
                            };
                        }).concat(txs.in.map(e => {
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
                        resolve(transactions.sort((a, b) =>
                            b.time.getTime() - a.time.getTime()));
                    } else {
                        if (!txs.txs) { reject(this.trans
                            .translate('err.server_response_error')); }
                            try {
                                const trx = JSON.parse(txs.txs);
                                const trans = trx.txs;
                                const transactions = trans.map(e => {
                                    return {
                                        blockheight: e.blockheight,
                                        id: e.txid,
                                        time: new Date(e.time * 1000),
                                        vin: e.vin.map(el => {
                                            return {
                                                adress: el.addr,
                                                value: el.value,
                                                txid: el.txid
                                            };
                                        }),
                                        vout: e.vout.map(el => {
                                            return {
                                                address: el.scriptPubKey.addresses,
                                                value: el.value
                                            };
                                        })
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
                                resolve(toTxs);
                            } catch (err) {
                            reject(this.trans
                                .translate('err.server_response_error')); }
                    }
                })
                .catch(err => reject(err));
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
            self._verifyAccountParams_P(opts)
                .then(() => self._getApi_P(opts))
                .then(tx => resolve(tx))
                .catch(err => reject(err));
        });
    }
    createTx(params: any, next: any) {
        this.infoInit();
        switch (params.symbol) {
            case 'ETH':
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
                break;
            case 'BTC':
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
                            tx.from(JSON.parse(ut.utxos));
                            tx.to(params.receiver, params.ammount * 1e8);
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
        this._getApi({
            method: 'sendRawTransaction',
            symbol: params.symbol,
            network: params.network,
            hex: params.hex
        }, res => {console.dir(res);
        if (params.symbol === 'EHT') {
            if (res.err || res.hash.hs.err) {
                next({err: res.err});
            } else {
                next({hash: res.hash.hs.hash});
            }
        } else {
            if (res.err) {
                next({err: res.err});
            } else {
                next({txid: res.txid});
            }
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
    openAccount(params: any) {
        const self = this,
            opts: any = {};
        opts.symbol = params.symbol || null;
        opts.keyFile = params.keyFile || null;
        opts.passphrase = params.passphrase || null;
        opts.network = params.network || null;
        return new Promise((resolve, reject) => {
            self._verifyAccountParams_P(opts)
                .then(() => {
                    const account = self.isOpen(params);
                    if (account) { return account; }
                    switch (params.symbol) {
                            case 'ETH':
                                return self._openETHAccount(params);
                            case 'BTC':
                                return self._openBTCAccount(params);
                            default:
                                return self._openETHAccount(params);
                        }
                })
                .then(acc => resolve(acc))
                .catch(err => reject(err));
        });
    }
    getGas() {
        return new Promise((resolve, reject) => {
            this._getApi({
                method: 'getPriceLimit',
                symbol: 'ETH',
                network: 'ropsten'
            }, gas => {
                if (!gas || !gas.gasLimit) {
                    reject(this.trans.translate('err.server_connection_error'));
                } else {
                    resolve(gas.gasLimit);
                }
            });
        });
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
    _verifyAccountParams(params: any): boolean {
        console.log('step 15');
        if (typeof params !== 'object') {
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
                    case 'id':
                        if ( typeof params[ind] !== 'string') {
                            this.error(this.trans.translate('err.wrong_id'));
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
    _verifyAccountParams_P(params: any) {
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
                const file = new FileReader();
                file.readAsText(params.keyFile);
                file.onload = (event: any) => {
                    try {
                        const keyFile: any = JSON.parse(event.target.result);
                        Keythe.recover(params.passphrase, keyFile, (pKey) => {
                            if (pKey) {
                                const account = new Account();
                                account.address = '0x' + keyFile.address;
                                account.key = pKey;
                                account.network = params.network;
                                account.symbol = params.symbol;
                                account.transactions = [];
                                account.balance = '';
                                account.unlock = true;
                                account.open = false;
                                account.hide = true;
                                this.accounts.push(account);
                                resolve(account);
                            } else { reject(this.trans
                                .translate('err.eth_account_open_error')); }
                        });
                    } catch (e) { reject(e.message); }

                };
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
    _createBTCAccount(params: any, callback: any) {
        try {
            const phrase = new Buffer(params.passphrase),
                hash = Bitcore.crypto.Hash.sha256(phrase),
                bn = Bitcore.crypto.BN.fromBuffer(hash),
                pkey = new Bitcore.PrivateKey(params.network),
                key = pkey.toWIF(),
                salt = crypto.randomBytes(32).toString('hex').slice(0, 32),
                iv = crypto.randomBytes(16),
                cifer = crypto.createCipher('aes256', params.passphrase);
            // crypto.createCipheriv('aes-256-cbc', salt, iv);
                let cifertext = cifer.update(Buffer.from(key), 'utf8', 'hex');
                cifertext += cifer.final('hex');
                const keyFile = {
                    address: pkey.toAddress().toString(),
                    calg: 'aes256',
                //    salt: salt,
                //    iv: iv,
                //    it: 1000,
                //    kl: 256,
                //    ciferalg: 'aes-256-cbc',
                //    alg: 'sha256',
                    cifertext: cifertext
                };
             console.log(key);
                const decifer = crypto.createDecipher('aes256', params.passphrase);
            // const decifer = crypto.createDecipheriv('aes-256-cbc', keyFile.salt, keyFile.iv);
             let   dectext = decifer.update(keyFile.cifertext, 'hex', 'utf8');
             dectext += decifer.final('utf8');
             console.dir(dectext);
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
                account.address = keyFile.address;
                account.key = pkey; // .toString('hex');
                account.network = params.network;
                account.symbol = params.symbol;
                account.transactions = [];
                account.balance = '';
                this.accounts.push(account);
                callback(account);
            }
        } catch (e) {
            console.log(e.message);
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
                            '/balance/' + opts.address;
                        self.http.get(url,
                            opts)
                            .subscribe(response => {console.dir(response);
                            const bs: any = response;
                                next(response ?
                                    (opts.symbol === 'ETH') ? response : {balance: bs.b} : null);
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
                        self.http.get(opts.url + opts.symbol + '/UTXOs/' +
                            opts.address, opts)
                            .subscribe(response => {console.dir(response);
                                next(response ? response : null);
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
                .set('Content-Type', 'application/json')
        };
        return new Promise((resolve, reject) => {
            if (!opts.method) {reject('Error method.'); }
            if (!opts.symbol) {reject('Error symbol.'); }
            if (!opts.network) {reject('Error network.'); }
            switch (opts.method) {
                case 'getBalance': {
                    const url = opts.symbol === 'ETH' ? opts.url + opts.symbol +
                        '/getBalance/' + opts.address :
                        opts.url + opts.symbol +
                        '/balance/' + opts.address;
                        self.http.get(url, opts)
                            .subscribe(response => {
                                const bs: any = response;
                                response ?
                                        resolve((opts.symbol === 'ETH') ? response : {balance: bs.b})
                                    : reject(null);
                                });
                            break;
                        }
                case 'getTransactions': {
                    console.log('step11');
                    self.http.get(opts.url + opts.symbol +
                    '/getTransactionsList/' + opts.address, opts)
                    .subscribe(response => {
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
                                '/UTXOs/' +
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
