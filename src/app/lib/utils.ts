import { config } from '../config';
import {HttpClient, HttpHeaders} from '@angular/common/http';

export default {
    config: config(),
    http: HttpClient,
    verifyParams: function (params) {
        if (typeof params !== 'object') {
            return {status: false, error: 'params'};
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
                return {status: false, error: field};
            }
        }
        return {status: true};
    },
    getApi: async function (params, http: HttpClient) {
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
    },
    keyFileName: function (address: string) {
        try {
            const cd = new Date();
            const month = ((cd.getMonth() + 1).toString().length === 1) ?
                '0' + (cd.getMonth() + 1).toString() : (cd.getMonth() + 1).toString();
            const days = (cd.getDate().toString().length === 1) ?
                '0' + cd.getDate().toString() : cd.getDate().toString();
            const hours = (cd.getHours().toString().length === 1) ?
                '0' + cd.getHours().toString() : cd.getHours().toString();
            const mins = (cd.getMinutes().toString().length === 1) ?
                '0' + cd.getMinutes().toString() : cd.getMinutes().toString();
            const seconds = (cd.getSeconds().toString().length === 1) ?
                '0' + cd.getSeconds().toString() : cd.getSeconds().toString();
            const mseconds = (cd.getMilliseconds().toString().length === 1) ?
                '00' + cd.getMilliseconds().toString() :
                ((cd.getMilliseconds().toString().length === 2) ? '0' + cd.getMilliseconds().toString()
                    : cd.getMilliseconds().toString());
            const filename = 'UTC--' + cd.getFullYear() + '-'
                + month + '- ' + days + 'T' + hours + ':' + mins + ':' + seconds + '.' + mseconds +
                'Z--' + address;
            return {status: true, fileName: filename};
        } catch (error) {
            return {
                status: false,
                error: error.message
            };
        }
    },
    uploadFile: function (data: any, fileName: string) {
        try {
            const blob = new Blob([JSON.stringify(data)],
                {type: 'text/json'});
            const e = document.createEvent('MouseEvent');
            const a = document.createElement('a');
            const fn = this.keyFileName(data.address);
            if (!fn.status) {
                return fn;
            }
            a.download = fn.fileName;
            a.href = window.URL.createObjectURL(blob);
            a.dataset.downloadurl = ['text/json', a.download, a.href]
                .join(':');
            e.initMouseEvent('click', true,
                false, window,
                0, 0, 0, 0,
                0, false, false,
                false, false, 0,
                null);
            a.dispatchEvent(e);
        } catch (error) {
            return {status: false, error: error.message};
        }
    }
};
