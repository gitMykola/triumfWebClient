import { Transaction } from './transaction';
export class Account {
    public symbol: string;
    public network: string;
    public address: string;
    private _pKey: string;
    public transactions: Transaction[];
    public balance: string;
    get key(): any {
        return this._pKey;
    }
    set key(key: any) {
        this._pKey = key;
    }
}
