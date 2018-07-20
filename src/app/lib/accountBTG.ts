import {TransactionBTG} from './transaction';
import * as Bitgold from 'bgoldjs-lib';
import * as BG from 'bitcoinjs-lib';
import {Buffer} from 'buffer';
import * as crypto from 'crypto-browserify';
import * as Big from 'bignumber.js';
import * as btgTx from './btgTx';
// import * as Address from '/home/mykola/.bitcoingold/bitcoinjs-lib-3.3.2/src/address';
// import * as Networks from '/home/mykola/.bitcoingold/bitcoinjs-lib-3.3.2/src/networks';
// import * as ECPair from '/home/mykola/.bitcoingold/bitcoinjs-lib-3.3.2/src/ecpair';
// import * as bscript from '/home/mykola/.bitcoingold/bitcoinjs-lib-3.3.2/src/script';
// import * as bcrypto from '/home/mykola/.bitcoingold/bitcoinjs-lib-3.3.2/src/crypto';
// import * as TransactionBuilder from '/home/mykola/.bitcoingold/bitcoinjs-lib-3.3.2/src/transaction_builder';
// import * as Transaction from '/home/mykola/.bitcoingold/bitcoinjs-lib-3.3.2/src/transaction';
// import * as outputPubKeyHash from '/home/mykola/.bitcoingold/bitcoinjs-lib-3.3.2/src/templates/pubkeyhash/output';

const AccountBTG = function(currencyCode: string, network: string) {
    this.code = currencyCode;
    this.network = network;
    this.chainId = network === 'btgnet' ? 1 : 2;
    this.address = '';
    this.keys = {
        private: '',
        public: ''
    };
    this.keyObject = {};
    this.balance = 0;
    this.transactionsPage = 0;
    this.transactionCommonCount = 0;
    this.transactions = [TransactionBTG];
    this.open = false;
    this.refresh = false;
    this.decimals = 1e8;
};
/****************************************************************************************
 * @summary Generate account private & public keys, create public address & etc...
 * @passphrase - String, account owner secret phrase
 * @return - Promise result(
 *               resolve - true, success generation,
 *               reject - error object, unsuccess generation
 *                       )
 * */
AccountBTG.prototype.generateKeys = async function(passphrase: string) {
    const net = BG.networks[
        this.chainId === 1 ? 'bitcoingold' : 'bitcoingoldtestnet'
        ];
    const pKey = BG.ECPair.makeRandom({
        // rng: () => {
        //     return Buffer.from(crypto.randomBytes(32), 'base64');
        // },
        network: net
    });
    this.keys.private = pKey.toWIF();
    this.address = pKey.getAddress(net);
    this.keyObject = this.saveToKeyObject(passphrase);
    return true;
    // const pKey = new Bitcore.PrivateKey(this.network);
    // this.keys.private = pKey.toWIF();
    // this.address = pKey.toAddress().toString();
    // this.keyObject = this.saveToKeyObject(passphrase);
    // return true;
};
/****************************************************************************************
 * @summary Recover account private key, create public address & etc... from keyObject
 * @passphrase - String, account owner secret phrase,
 * @keyObject - Object, keystore object
 * @return - Promise result(
 *               resolve - true, success recovering,
 *               reject - error object, unsuccess recovering
 *                       )
 * */
AccountBTG.prototype.recoveryFromKeyObject = async function(passphrase: string, keyObject: any) {
    let dKey, decifer: any = {};
    decifer = crypto.createDecipher(
        keyObject.calg,
        passphrase);
    dKey = decifer.update(keyObject['cifertext'], 'hex', 'utf8');
    dKey += decifer.final('utf8');
    this.keys.private = dKey;
    this.keyObject = keyObject;
    this.address = keyObject.address; console.dir(Bitgold);
    return true;
};
/****************************************************************************************
 * @summary Save account to keyObject
 * @return - Promise result(
 *               resolve - keyObject - Object, keystore object,
 *               reject - error - Object, unsuccess recovering
 *                       )
 * */
AccountBTG.prototype.saveToKeyObject = function(passphrase: string) {
    const cifer = crypto.createCipher('aes256', passphrase);
    let cifertext = cifer.update(Buffer.from(this.keys.private),
        'utf8', 'hex');
    cifertext += cifer.final('hex');
    return {
        address: this.address,
        calg: 'aes256',
        cifertext: cifertext
    };
};
/****************************************************************************************
 * @summary Create raw transaction to braodcast and spend ethereum coins
 * @params - Object {
 *      nonce - number - common number of spent transactions,
 *      gasPrice - number - ethereum gas price,
 *      gasLimit - number - ethereum gas limit,
 *      receiver - string - recipient address,
 *      value - number - transaction value, units - ethereum, not wei
 * }
 * @return - Promise result(
 *               resolve - keyObject - Object, keystore object,
 *               reject - error - Object, unsuccess recovering
 *                       )
 * */
AccountBTG.prototype.createSendMoneyTransaction = async function(params) {
    const txid = new Array(0);
    const sender = new Array(0);
    const vinValue = new Array(0);
    const vin = new Array(0);
    params['utxo'].forEach(utx => {
        txid.push(utx.txid);
        sender.push(utx.address);
        vinValue.push(utx.amount);
        vin.push(utx.vout);
    });
    const btxData = [
        txid.join('_'),
        sender.join('_'),
        vinValue.join('_'),
        vin.join('_'),
        this.keys.private,
        params['receiver'],
        params['fees'].toString(),
        params['amount'].toString()
    ];
    console.dir(btxData);
    const raw = btgTx(btxData);
    console.dir(raw);
    return raw;
};

export default AccountBTG;
