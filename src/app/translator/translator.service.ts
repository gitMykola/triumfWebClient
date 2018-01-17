import {RU} from './ru';
import {EN} from './en';

import {Injectable} from '@angular/core';

@Injectable()
export class TranslatorService {
    private _currentLang: string;
    public _dictionary: {};
    public get currentLang() {
        return this._currentLang;
    }
    constructor() {}
    public set(lang: string) {
        this._currentLang = lang ? lang : 'EN';
        switch (this._currentLang) {
            case 'RU':
                this._dictionary = RU;
                break;
            default:
                this._dictionary = EN;
        }
    }
    public translate(key: string): string {
        const k = {
            key1: key.split('.')[0],
            key2: key.split('.')[1]} || null;
        return key && this._dictionary[k.key1][k.key2] ? this._dictionary[k.key1][k.key2] : '';
    }
}