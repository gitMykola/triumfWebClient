import {TransactionBTG} from './transaction';
import * as Bitgold from 'bitcoinjs-lib';
import * as Bitcore from 'bitcore-lib';
import {Buffer} from 'buffer';
import * as crypto from 'crypto-browserify';
import * as Big from 'bignumber.js';

const AccountBTG = function(currencyCode: string, network: string) {
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
    const pKey = Bitgold.ECPair.makeRandom({
        rng: () => Buffer.from(crypto.randomBytes(32)),
        network: this.chainId === 1 ? {
            messagePrefix: '\x1DBitcoin Gold Signed Message:\n',
            bech32: 'btg',
            bip32: {
                public: 0x0488b21e,
                private: 0x0488ade4
            },
            pubKeyHash: 0x26,
            scriptHash: 0x17,
            wif: 0x80
        } : Bitgold.networks.testnet
    });
    this.keys.private = pKey.toWIF();
    this.address = pKey.getAddress();
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
AccountBTG.prototype.recoveryFromKeyObject = async function(passphrase: string, keyObject: any) {
    let dKey, decifer: any = {};
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
AccountBTG.prototype.createSendMoneyTransaction = async function(params) {// console.dir(params);
    const tx = Bitcore.Transaction();
    const dec = new Big(this.decimals);
    const utxos = [];
    params['utxo'].forEach(utxo => {
        const uAmount = new Big(utxo.amount);
        utxos.push({
            txId : utxo.txid,
            outputIndex : utxo.vout,
            address : utxo.address,
            script : utxo.scriptPubKey,
            satoshis : parseInt(uAmount.mul(dec).toString(), 10)
        });
    });
    const amount = new Big(params['amount']);
    tx.from(utxos);
    tx.to(params['receiver'], parseInt(amount.mul(dec).toString(), 10));
    tx.change(params['change']);
    const pKey = Bitgold.ECPair.fromWIF(this.keys.private);
    tx.sign(pKey);
    return tx.serialize();
};

export default AccountBTG;
