import {TransactionBTC} from './transaction';
import Utils from '../lib/utils';
import * as Bitcore from 'bitcore-lib';
import {Buffer} from 'buffer';
import * as crypto from 'crypto-browserify';

const AccountBTC = function(currencyCode: string, network: string) {
    this.code = currencyCode;
    this.network = network;
    this.chainId = network === 'livenet' ? 1 : 2;
    this.address = '';
    this.keys = {
        private: '',
        public: ''
    };
    this.keyObject = {};
    this.balance = 0;
    this.transactionsCount = 0;
    this.transactionsPage = 0;
    this.transactionCommonCount = 0;
    this.transactions = [TransactionBTC];
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
AccountBTC.prototype.generateKeys = async function(passphrase: string) {
    const pKey = new Bitcore.PrivateKey(this.network);
    this.keys.private = pKey.toWIF();
    this.address = pKey.toAddress().toString();
    this.keyObject = this.saveToKeyObject(passphrase);
    return true;
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
AccountBTC.prototype.recoveryFromKeyObject = async function(passphrase: string, keyObject: any) {
    let dKey, decifer: any = {};console.dir(keyObject);
    decifer = crypto.createDecipher(
        keyObject.calg,
        passphrase);
    dKey = decifer.update(keyObject['cifertext'], 'hex', 'utf8');
    dKey += decifer.final('utf8');
    this.keys.private = dKey;
    this.keyObject = keyObject;
    this.address = keyObject.address;
    return true;
};
/****************************************************************************************
 * @summary Save account to keyObject
 * @return - Promise result(
 *               resolve - keyObject - Object, keystore object,
 *               reject - error - Object, unsuccess recovering
 *                       )
 * */
AccountBTC.prototype.saveToKeyObject = function(passphrase: string) {
    const cifer = crypto.createCipher('aes256', passphrase);
    let cifertext = cifer.update(Buffer.from(this.keys.private),
        'utf8', 'hex');
    cifertext += cifer.final('hex');
    const pKey = Bitcore.PrivateKey.fromWIF(this.keys.private);
    return {
        address: pKey.toAddress().toString(),
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
AccountBTC.prototype.createSendMoneyTransaction = async function(params) {
    const tx = Bitcore.Transaction();
    tx.from(params['utxo']);
    tx.to(params['receiver'], params['amount'] * this.decimals);
    tx.change(params['change']);console.dir(tx);
    tx.sign(Bitcore.PrivateKey.fromWIF(this.keys.private));
    return tx.serialize();
};

export default AccountBTC;
