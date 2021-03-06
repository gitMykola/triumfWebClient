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
            sender: value => {
                return (typeof value === 'string'
                    && value.length >= 32 && value.length <= 128);
            },
            receiver: value => {
                return (typeof value === 'string'
                    && value.length >= 32 && value.length <= 128);
            },
            contract: value => {
                return (typeof value === 'string'
                    && value.length >= 32 && value.length <= 128);
            },
            hash: value => {
                return (typeof value === 'string');
            },
            id: value => {
                return (typeof value === 'string');
            },
            txid: value => {
                return (typeof value === 'string');
            },
            time: value => {
                return (typeof value === 'object');
            },
            value: value => {
                return (typeof value === 'string');
            },
            amount: value => {
                return (typeof value === 'number'
                && value > 0);
            },
            gasLimit: value => {
                return (typeof value === 'number'
                    && value > 0);
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
            },
            change: value => {
                return (typeof value === 'string'
                    && value.length >= 32 && value.length <= 128);
            },
            hex: value => {
                return (typeof value === 'string'
                    && value.length > 0 && value.length <= 65000);
            },
            utxo: value => {
                return (typeof value === 'object');
            },
            fees: value => {
                return (typeof value === 'number'
                    && value > 0);
            }
        };
        for (const field in params) {
            if (!verifySet[field] || !verifySet[field](params[field])) {
                return {status: false, error: 'Error field: ' + field};
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
                                 '/getTransactionsList/' + opts.address;
                            http.get(url, httpOptions).subscribe(response => {
                                console.dir(response);
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getTransaction: opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                (opts.symbol === 'ETH' ? '/getTransactionByHash/' + opts.hash
                                    : '/getTransactionById/' + opts.txid);
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getGasPrice: opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                '/getGasPrice';
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getPriceLimit: opts => {
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
                sendRawTransaction: opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                '/sendRawTransaction/' + opts.hex;
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response});
                            });
                        } catch (err) {console.dir(err);
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getTransactionCount: opts => {
                    return new Promise(resolve => {
                        try {
                            const url = self.config.app.apiURL + opts.symbol +
                                '/getTransactionCount/' + opts.address;
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve({status: true, data: response['TransactionCount']});
                            });
                        } catch (err) {
                            return resolve({status: false, error: err.message});
                        }
                    });
                },
                getUTXOS: opts => {
                    return new Promise((resolve, reject) => {
                        try {
                            opts.page = opts.page || 0;
                            const url = self.config.app.apiURL + opts.symbol +
                                '/getUTXOs/' + opts.address + '/' + opts.page;
                            http.get(url, httpOptions).subscribe(response => {
                                return resolve(response);
                            });
                        } catch (err) {
                            return reject(err.message);
                        }
                    });
                },
                getAllUTXOs: async opts => {
                    try {
                        let utxos = [];
                        let result = await apis.getUTXOS(opts);
                        utxos = utxos.concat(result['utxos']);
                        if (result['pages'] > 1) {
                            let page = 1;
                            while ( page < result['pages'] ) {
                                result = await apis
                                    .getUTXOS(Object.assign(opts, {page: page}));
                                utxos = utxos.concat(result['utxos']);
                                page++;
                            }
                        }console.dir(utxos);
                        return {status: true, data: utxos};
                    } catch (error) {console.dir(error);
                        return {status: false, error: error.message};
                    }
                }
            };
            if (typeof apis[params.method] !== 'function') {
                return {status: false, error: 'method_not_found'};
            }
            return await apis[params.method](params);
        } catch (error) {console.dir(error);
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
                + month + '-' + days + 'T' + hours + ':' + mins + ':' + seconds + '.' + mseconds +
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
            return fn;
        } catch (error) {
            return {status: false, error: error.message};
        }
    },
    readKeyFile: function (file: File) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.readAsText(file);
                reader.onload = (event) => {
                    try {
                        const keyFile = JSON.parse(event['target']['result']);
                        return resolve(keyFile);
                    } catch (err) { reject(err.message); }

                };
            } catch (error) {
                return reject(error.message);
            }
        });
    }
};
