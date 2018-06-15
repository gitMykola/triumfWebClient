import { config } from '../config';
import {HttpClient, HttpHeaders} from '@angular/common/http';

export const utils = {
    config: config(),
    // http: HttpClient,
    verifyParams: function (params) {
        if (typeof params !== 'object') {
            return {status: false, error: 'wrong_params_object'};
        }
        const verifySet = {
            symbol: value => {
                return (typeof value === 'string'
                    && this.config.symbols.indexOf(value) >= 0);
            },
            passphrase: value => {
                return (typeof value === 'string'
                    && value.length >= 6 && value.length <= 256);
            },
            address: value => {
                return (typeof value === 'string'
                    && value.length >= 32 && value.length <= 128);
            },
            hash: value => {
                return (typeof value === 'string');
            },
            id: value => {
                return (typeof value === 'string');
            },
            time: value => {
                return (typeof value === 'object');
            },
            value: value => {
                return (typeof value === 'string');
            },
            short_hash: value => {
                return (typeof value === 'string');
            },
            _pKey: value => {
                return (typeof value === 'string'
                    && value.length >= 32 && value.length <= 256);
            },
            key: value => {
                return true; // TODO check key field
            },
            keyFile: value => {
                return (typeof value === 'object');
            },
            transitions: value => {
                return (typeof value === 'object');
            },
            network: value => {
                return (typeof value === 'string'
                    && this.config.networks.indexOf(value) >= 0);
            },
            method: value => {
                return (typeof value === 'string');
            }
        };
        for (const field in params) {
            if (!verifySet[field] || !verifySet[field](params[field])) {
                return {status: false, error: 'wrong_field_' + field};
            }
        }
        return {status: true};
    },
    getApi: async function (params, http) {
        try {
            const verify = this.verifyParams(params);
            if (!verify.status) {
                return verify;
            }
            const self = this;
            const httpOptions = {
                headers: new HttpHeaders()
                    .append('Content-Type', 'application/json')
            };
            const apis = {
                getBalance: opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                '/getBalance/' + opts.address;
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getTransactions: opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                (opts.symbol === 'ETH' ? '/getTransactionsList/'
                                    : '/getTxList/') + opts.address;
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getTransaction: async opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                (opts.symbol === 'ETH' ? '/getTransactionByHash/' + opts.hash
                                    : '/getTransactionById/' + opts.id);
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getPriceLimit: async opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                '/getPriceLimit';
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                sendRawTransaction: async opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                '/sendRawTransaction/' + opts.hex;
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getTransactionCount: async opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                '/getTransactionCount/' + opts.address;
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getUTXOS: async opts => {
                    return new Promise(resolve => {
                    try {
                        const url = self.config.app.apiURL + opts.symbol +
                            '/getUTXOs/' + opts.address;
                        http.get(url, httpOptions).subscribe(response => {
                            return resolve({status: true, data: response});
                        });
                    } catch (err) {
                        return resolve({status: false, error: err.message});
                    }
                });}
            };
            if (typeof apis[params.method] !== 'function') {
                return {status: false, error: 'method_not_found'};
            }
            return await apis[params.method](params);
        } catch (error) {
            return error;
        }
    }
};
