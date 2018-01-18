export function config () { return {
    app: {
        name: 'Triumf Web Wallet'
    },
    dev: {
        mode: 1
    },
    currencies: {
        ETH: {
          symbol: 'ETH',
          networks: ['livenet', 'ropsten']
        },
        BTC: {
          symbol: 'BTC',
            networks: ['livenet', 'testnet']
      }
    },
    symbols: ['ETH', 'BTC', 'LTC', 'BTG', 'BCH'],
    networks: ['livenet', 'testnet', 'ropsten']
};
}
