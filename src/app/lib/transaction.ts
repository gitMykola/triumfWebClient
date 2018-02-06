import * as Big from 'bignumber.js';
export class Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    fee: string;
    time: number;
}
export class ETHTransaction {
    hash: string;
    status: boolean;
    blockHeight: number;
    timestamp: number;
    from: string;
    to: string;
    value: string;
    gasLimit: string;
    gasUsedByTxn: string;
    gasPrice: string;
    fee: string;
    cumulativeGasUsed: string;
    nonce: string;
    input: string;
    constructor() {}
}
export class BTCTransaction {
    txid: string;
    size: Big;
    feeRate: Big;
    timestamp: Date;
    blockheight: number;
    vin: any;
    vout: any;
    fees: Big;
    confirmations: number;
    sumVout: number;
    constructor() {}
}
