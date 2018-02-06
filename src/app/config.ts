export function config () { return {
    app: {
        name: 'Triumf Web Wallet',
        lang: [
            {symbol: 'EN', name: 'English'},
            {symbol: 'RU', name: 'Русский'}
            ],
        apiURL: 'http://194.71.227.15/api/v4.0/'
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
