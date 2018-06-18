import AccountETH from '../lib/accountETH';
// import {async} from 'rxjs/scheduler/async';
import Utils from '../lib/utils';
import { async, TestBed } from '@angular/core/testing';
import * as testData from '../tests/testDataETH.json';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';
import {HttpClient, HttpClientModule} from '@angular/common/http';

beforeEach(async(() => {
    TestBed.resetTestEnvironment();
    TestBed
        .initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting())
        .configureTestingModule({
            imports: [ HttpClientModule ]
        });
}));

describe('TransactionETH Object', () => {
    it('generateKeys', async () => {
        const accountETH = new AccountETH(testData['code'], testData['network']);
        const gen = await accountETH.generateKeys(testData['passphrase']);
        if (gen) {
            expect(accountETH.address.length).toEqual(42, 'Bad ETH account generation proccess');
        } else {
            expect(true).toEqual(false);
        }
    });
    it('recoveryFromKeyObject', async () => {
        const accountETH = new AccountETH(testData['code'], testData['network']);
        await accountETH.recoveryFromKeyObject(testData['passphrase'], testData['keyObject']);
        expect(accountETH.address).toEqual(testData['address']);
    });
    it('saveToKeyObject', async () => {
        const accountETH = new AccountETH(testData['code'], testData['network']);
        await accountETH.recoverFromKeyObject(testData['passphrase'], testData['keyObject']);
        const keyObject = await accountETH.saveToKeyObject(testData['passphrase']);
        expect(keyObject).toEqual(testData['keyObject']);
    });
    it('createSendMoneyTransaction', async () => {
        const accountETH = new AccountETH(testData['code'], testData['network']);
        await accountETH.recoveryFromKeyObject(testData['passphrase'], testData['keyObject']);
        const txParams = {
            nonce: 0,
            gasPrice: 630000,
            gasLimit: 21000,
            receiver: testData['address'],
            value: 2.24
        };
        const rawTx = await accountETH.createSendMoneyTransaction(txParams);console.dir(rawTx);
        expect(typeof rawTx).toBe('string');
    });
    it('createTokensERC20Transaction', async () => {
        const accountETH = new AccountETH(testData['code'], testData['network']);
        await accountETH.recoveryFromKeyObject(testData['passphrase'], testData['keyObject']);
        const txParams = {
            nonce: 0,
            gasPrice: 630000,
            gasLimit: 21000,
            receiver: testData['address'],
            contract: testData['contract'],
            value: 2.24
        };
        const rawTx = await accountETH.createSendMoneyTransaction(txParams);console.dir(rawTx);
        expect(typeof rawTx).toBe('string');
    });
});
