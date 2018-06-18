import * as Big from 'bignumber.js';
const Transaction = {
    from: '',
    to: '',
    value: '',
    fee: '',
    timestamp: 0,
    status: false,
    state: false,
    blockHeight: 0,
    confirmations: 0
};
const TransactionETH = Object.assign({
    hash: '',
    gasLimit: Big.ZERO,
    gasUsedByTxn: Big.ZERO,
    gasPrice: Big.ZERO,
    cumulativeGasUsed: Big.ZERO,
    nonce: Big.ZERO,
    input: '',
}, Transaction);
const TransfersERC20 = Object.assign({
    hash: '',
    input: {},
}, Transaction);
const TransactionBTC = Object.assign({
    txid: '',
    size: Big.ZERO,
    feeRate: Big.ZERO,
    timestamp: Date,
    blockheight: 0,
    vin: {},
    vout: {},
    sumVout: Big.ZERO
}, Transaction);

export { TransactionETH, TransactionBTC, Transaction, TransfersERC20 };

// export { TransactionBTC };

// export default TransactionETH;

