export function config () { return {
    app: {
        name: 'Triumf Web Wallet',
        lang: [
            {symbol: 'EN', name: 'English'},
            {symbol: 'RU', name: 'Русский'}
            ],
        apiURL: 'http://193.200.173.204:2345/api/v4.0/' // 'http://158.255.211.2:2345/api/v4.0/' // 'http://localhost:2345/api/v4.0/'
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
        },
        {
            symbol: 'ZEC',
            networks: ['testnet', 'livenet']
        },
        {
            symbol: 'XMR',
            networks: ['livenet']
        }
    ],
    symbols: ['ETH', 'BTC', 'LTC', 'BTG', 'BCH', 'ZEC', 'XMR'],
    networks: ['livenet', 'testnet', 'ropsten']
};
}
