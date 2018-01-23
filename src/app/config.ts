export function config () { return {
    app: {
        name: 'Triumf Web Wallet',
        lang: [
            {symbol: 'EN', name: 'English'},
            {symbol: 'RU', name: 'Русский'}
            ]
    },
    dev: {
        mode: 1
    },
    currencies: [
        {
          symbol: 'ETH',
          networks: ['ropsten', 'livenet']
        },
        {
          symbol: 'BTC',
          networks: ['testnet', 'livenet']
        },
        {
            symbol: 'LTC',
            networks: ['testnet', 'livenet']
        },
        {
            symbol: 'BTG',
            networks: ['testnet', 'livenet']
        },
        {
            symbol: 'BCH',
            networks: ['testnet', 'livenet']
        }
    ],
    symbols: ['ETH', 'BTC', 'LTC', 'BTG', 'BCH'],
    networks: ['livenet', 'testnet', 'ropsten']
};
}
