import * as Bgold from 'bgoldjs-lib';
import Networks from '../lib/networks';
import * as cash from 'bitcoincashjs';

const cashAddress = cash.Address;
const Address = Bgold.address;

const Bitcore = {
    create: (net) => {
        try {
            const network = Networks[net];
            if (typeof net !== 'string' || Networks[net] === undefined) {
                throw new Error('Wrong network!');
            }
            const keys = Bgold.ECPair.makeRandom({
                network: network
            });
            const data = {
                private: keys.toWIF(),
                address: keys.getAddress(network)
            };
            if (network.code === 'BCH') {
                data['cashAddress'] = cashAddress.fromString(
                    data.address,
                    network.netType,
                    'pubkeyhash',
                    cashAddress.LegacyFormat)
                    .toString(cashAddress.CashAddrFormat);
                data['bitpayAddress'] = cashAddress.fromString(
                    data.address,
                    network.netType,
                    'pubkeyhash',
                    cashAddress.LegacyFormat)
                    .toString(cashAddress.BitpayFormat);
            }
            return data;
        } catch (e) {
            console.log(e.message);
            return false;
        }
    }
};

export default Bitcore;

