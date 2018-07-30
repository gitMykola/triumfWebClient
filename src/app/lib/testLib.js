const BGold = require('bgoldjs-lib'),
      Networks = require('./networks'),
      cashAddress = require('bitcoincashjs'),
      argv = require('minimist')(process.argv.slice(2));
const cashaddr = require('cashaddrjs');


/**
 * Print available networks
 */
if(argv.networks) Object.keys(Networks).forEach((currency) => {
    const nets = Object.keys(Networks[currency]);
    console.log(currency + ' networks: ' + nets.join(', '));
});

if(argv.create && argv.code) {
    const net = argv.network || 'livenet';
    const pKey = BGold.ECPair.makeRandom({
        network: Networks[argv.code][net]
    });
    console.log('Private key (WIF format): ' + pKey.toWIF());
    const addr = pKey.getAddress(Networks[argv.code][net]);
    console.log('Address: ' + addr);
    if (argv.code === 'BCH') console.log(
        'Bitcoin Cash Format Address: ' + cashAddress.Address.fromString(addr, net,'pubkeyhash',cashAddress.Address.LegacyFormat).toString(cashAddress.Address.CashAddrFormat)/*cashaddr.encode('bitcoincash', 'P2PKH', Hash.sha256ripemd160(pKey.getPublicKeyBuffer()))*/
    );
}

//
// const pKey = 'KxWp49g24QQAy3RUuoMUfZgdEJkKDFbxSLxZiEFywDPwQdVkFGJd';
// const address = 'GYv7tb9o5RrM5WQ3HmeyHEvBgWBc4Ri2rt';
//
// const key = BGold.ECPair.fromWIF(pKey,BGold.networks['bitcoingold']);
// //const pubKey = ec.keyFromPrivate(pKey, 'hex');
// console.dir(BGold.ECPair.fromWIF(pKey,BGold.networks['bitcoingold']).getAddress());
// console.dir(BGold.address.toBase58Check(BGold.crypto.hash160(key.getPublicKeyBuffer()), BGold.networks.bitcoingold.pubKeyHash));
//
// const cad = BGold.address.toBase58Check(BGold.crypto.hash160(key.getPublicKeyBuffer()), BGold.networks.bitcash.pubKeyHash);
//
// console.dir(cad);
// console.dir(BGold.address.toBase58Check(BGold.crypto.hash160(key.getPublicKeyBuffer()), BGold.networks.litecoin.pubKeyHash));
// console.dir(BGold.address.toBase58Check(BGold.crypto.hash160(key.getPublicKeyBuffer()), BGold.networks.bitcoin.pubKeyHash));
//
// //console.dir(cashaddr.decode('bitcoincash:qzj42gx3xfgzfrrl7deuk9e5tde3jyh2yv3sd07hz2'));
//
// console.dir(cashAddress.Address.fromString(cad,'livenet','pubkeyhash',cashAddress.Address.LegacyFormat).toString(cashAddress.Address.CashAddrFormat));

//console.log(cashaddr.encode('bitcoincash','P2PKH',key.getPublicKeyBuffer()));
// console.dir(BGold.ECPair.fromWIF(pKey,BGold.networks['litecoin']).getAddress());
// console.dir(BGold.ECPair.fromWIF(pKey,BGold.networks['bitcash']).getAddress());


// const cashPKEY = BGold.ECPair.makeRandom();
// console.dir(cashPKEY.getAddress());
//
// const asm = 'a55520d13250248c7ff373cb17345b731912ea23';
//
//
// console.dir(bitcore.Script.fromASM(asm));
// const btgAddr = bitcore.Address.fromScriptHash(bitcore.Script.fromASM(asm).chunks[0].buf, 'btgnet');
//
// console.dir(btgAddr.toString());
//
// const bitj = bitjs.script.fromASM('OP_DUP OP_HASH160 a55520d13250248c7ff373cb17345b731912ea23 OP_EQUALVERIFY OP_CHECKSIG');
// console.dir(bitj);
// const pk = bitjs.ECPair.fromPublicKeyBuffer(bitj, 'bitcoingold');
//const bjAddr = bitjs.address.fromScriptHash(bitj.chunks[0].buf, 'bitcoingold');