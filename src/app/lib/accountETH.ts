import * as Keythe from '../../../node_modules/keythereum';
import {TransactionETH, TransfersERC20} from './transaction';
import * as EthTx from '../../../node_modules/ethereumjs-tx';

const AccountETH = function(currencyCode: string, network: string) {
    this.code = currencyCode;
    this.network = network;
    this.chainId = network === 'livenet' ? 1 : 3;
    this.address = '';
    this.keys = {
        private: '',
        public: ''
    };
    this.keyObject = {};
    this.balance = 0;
    this.transactionsSpentCount = 0;
    this.transactionsPage = 0;
    this.transactionCommonCount = 0;
    this.transactions = [TransactionETH];
    this.transfersERC20 = [TransfersERC20];
    this.open = false;
    this.refresh = false;
    this.decimals = 1e18;
};
/****************************************************************************************
 * @summary Generate account private & public keys, create public address & etc...
 * @passphrase - String, account owner secret phrase
 * @return - Promise result(
 *               resolve - true, success generation,
 *               reject - error object, unsuccess generation
 *                       )
 * */
AccountETH.prototype.generateKeys = async function(passphrase: string) {
    const opts = { keyBytes: 32, ivBytes: 16 };
    this.keys.private = await Keythe.create(opts);
    this.keyObject = await this.saveToKeyObject(passphrase);
    this.address = '0x' + this.keyObject.address;
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
AccountETH.prototype.recoveryFromKeyObject = async function(passphrase: string, keyObject: any) {
    this.keys.private = await Keythe.recover(passphrase, keyObject);
    this.address = '0x' + keyObject.address;
    return true;
};
/****************************************************************************************
 * @summary Save account to keyObject
 * @return - Promise result(
 *               resolve - keyObject - Object, keystore object,
 *               reject - error - Object, unsuccess recovering
 *                       )
 * */
AccountETH.prototype.saveToKeyObject = async function(passphrase: string) {
    const pKey = this.keys.private;
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
    return await Keythe.dump(passphrase, pKey.privateKey, pKey.salt, pKey.iv, options);
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
AccountETH.prototype.createSendMoneyTransaction = async function(params) {
    const txData = {
        nonce: '0x' + params['nonce'].toString(16),
        gasPrice: '0x' + params['gasPrice'].toString(16),
        gasLimit: '0x' + params['gasLimit'].toString(16),
        to: params['receiver'],
        value: '0x' + (params['value'] * 1e18).toString(16),
        chainId: this.chainId
    };
    const tx = new EthTx(txData);
    tx.sign(this.keys.private);
    return '0x' + tx.serialize().toString('hex');
};
/****************************************************************************************
 * @summary Create some ERC20 tokens spend transaction
 * @params - Object - {
 *      nonce - number - common number of spent transactions,
 *      gasPrice - number - ethereum gas price,
 *      gasLimit - number - ethereum gas limit,
 *      contract - string - contract address,
 *      value - number - tokens number, units - basic token units(integer value)
 *      receiver - string - recipient ethereum address
 * }
 * @return - Promise result(
 *               resolve - {
 *                  txId/txHash - string, transaction id/hash
 *               },
 *               reject - error object, unsuccessful request
 *                       )
 * */
AccountETH.prototype
    .createTokensERC20Transaction = async function(params) {
    const templ = '0000000000000000000000000000000000000000000000000000000000000000';
    const txData = {
        nonce: '0x' + params['nonce'].toString(16),
        gasPrice: '0x' + params['gasPrice'].toString(16),
        gasLimit: '0x' + params['gasLimit'].toString(16),
        to: params['contract'],
        value: '0x0',
        data: '0xa9059cbb000000000000000000000000'
        + params['receiver'].replace('0x', '')
        + templ.substr(0, 64 - params['value'].toString(16).length)
        + params['value'].toString(16),
        chainId: this.chainId
    };
    const tx = new EthTx(txData);
    tx.sign(this.keys.private);
    return '0x' + tx.serialize().toString('hex');
};

export default AccountETH;
