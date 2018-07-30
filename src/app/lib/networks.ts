// https://en.bitcoin.it/wiki/List_of_address_prefixes
// Dogecoin BIP32 is a proposed standard: https://bitcointalk.org/index.php?topic=409731

const Networks = {
    BTG: {
        livenet: {
            code: 'BTG',
            netTyoe: 'livenet',
            messagePrefix: '\x1DBitcoin Gold Signed Message:\n',
            bech32: 'btg',
            bip32: {
                public: 0x0488b21e,
                private: 0x0488ade4
            },
            pubKeyHash: 0x26,
            scriptHash: 0x17,
            wif: 0x80,
            forkHeight: 491407,
            equihash: {
                n: 200,
                k: 9
            }
        },
        testnet: {
            code: 'BTG',
            netType: 'testnet',
            messagePrefix: '\x1DBitcoin Gold Testnet Signed Message:\n',
            bech32: 'tbtg',
            bip32: {
                public: 0x043587cf,
                private: 0x04358394
            },
            pubKeyHash: 0x6f,
            scriptHash: 0xc4,
            wif: 0xef,
            forkHeight: 1,
            equihash: {
                n: 200,
                k: 9
            }
        },
        regtest: {
            code: 'BTG',
            netType: 'regtest',
            messagePrefix: '\x1DBitcoin Gold Regtest Signed Message:\n',
            bech32: 'tbtg',
            bip32: {
                public: 0x043587cf,
                private: 0x04358394
            },
            pubKeyHash: 0x6f,
            scriptHash: 0xc4,
            wif: 0xef,
            forkHeight: 2000,
            equihash: {
                n: 48,
                k: 5
            }
        }
    },
    BTC: {
        livenet: {
            code: 'BTC',
            netType: 'livenet',
            messagePrefix: '\x18Bitcoin Signed Message:\n',
            bech32: 'bc',
            bip32: {
                public: 0x0488b21e,
                private: 0x0488ade4
            },
            pubKeyHash: 0x00,
            scriptHash: 0x05,
            wif: 0x80
        },
        testnet: {
            code: 'BTC',
            netType: 'testnet',
            messagePrefix: '\x18Bitcoin Testnet Signed Message:\n',
            bech32: 'tb',
            bip32: {
                public: 0x043587cf,
                private: 0x04358394
            },
            pubKeyHash: 0x6f,
            scriptHash: 0xc4,
            wif: 0xef
        }
    },
    LTC: {
        livenet: {
            code: 'LTC',
            netType: 'livenet',
            messagePrefix: '\x19Litecoin Signed Message:\n',
            bip32: {
                public: 0x019da462,
                private: 0x019d9cfe
            },
            pubKeyHash: 0x30,
            scriptHash: 0x32,
            wif: 0xb0
        },
        testnet: {
            code: 'LTC',
            netType: 'testnet',
            messagePrefix: '\x19Litecoin Testnet Signed Message:\n',
            bip32: {
                public: 0x0436f6e1,
                private: 0x0436ef7d
            },
            pubKeyHash: 0x6f,
            scriptHash: 0x3a,
            wif: 0xef
        }
    },
    BCH: {
        livenet: {
            code: 'BCH',
            netType: 'livenet',
            messagePrefix: '\x1DBitcoin Cash Signed Message:\n',
            bech32: 'btg',
            bip32: {
                public: 0x0488b21e,
                private: 0x0488ade4
            },
            pubKeyHash: 0x00,
            scriptHash: 0x05,
            wif: 0x80
        }
    }
};

export {
    Networks
};
export default Networks;
