const Web3          =   require('web3');
const Tx            =   require('ethereumjs-tx');
const utils         =   require('ethereumjs-util');
const CronJob       =   require('cron').CronJob;
const config        =   require('./config');
const fs            =   require('fs');
const util          =   require('util');

var log_file = fs.createWriteStream(__dirname + '/samplelog', {flags : 'a'});
var log_stdout = process.stdout;

console.log = function(d) { //
    log_file.write(util.format(d) + '\n');
    log_stdout.write(util.format(d) + '\n');
};

function web3() {
    return new Web3(new Web3.providers.HttpProvider(config.network.mainnet.url));
}

//estimateGas for raw tx
function estimateGas(rawTx){
    return web3().eth.estimateGas(rawTx);
}

function calAmount(fromAddress, gasLimit, gasPrice) {
    var currentBalance = web3().eth.getBalance(fromAddress);
    var amount = currentBalance - gasLimit * gasPrice;
    return web3().fromWei(amount, 'ether');
}

function constructNewTx (fromAddress, toAddress, amount, gasLimit, gasPrice, data, chainId) {
    var newTxParams = {
        nonce: "0x" + web3().eth.getTransactionCount(fromAddress).toString("16"),
        gasPrice: "0x" + gasPrice.toString("16"),
        gasLimit: "0x" + gasLimit.toString("16"),
        to: toAddress,
        value: "0x" + Number(web3().toWei(amount, "ether")).toString(16),
        data: data,
        chainId: chainId
    }
    return newTxParams;
}

//sign raw transaction with private key
function signRawTx(rawTx, privateKey) {
    var constructedTx = new Tx(rawTx);
    constructedTx.sign(privateKey);
    var serializedTx = constructedTx.serialize();
    var data = '0x' + serializedTx.toString('hex');
    return data;

}

//submit transaction to blockchain
function submitTransaction(signedTX) {
    return new Promise(function(resolve, reject){
        web3().eth.sendRawTransaction(signedTX, function (err, txId) {
            if (err) reject(err);
            else resolve(txId);
        });
    });
};

//balance of address
function getBalance (address) {
    return new Promise(function(resolve, reject) {
        web3().eth.getBalance(address, function(err, data){
            if (err) reject(err);
            else {
                resolve(data);
            }
        })
    })
};

//send ETH
function sendETH(fromAddress, privateKey, toAddress, amount){

    var tx = constructNewTx(fromAddress, toAddress, amount, config.gasLimit, config.gasPrice, '' , config.network.mainnet.chainId);
//     var tx = constructNewTx(fromAddress, toAddress, amount, config.gasLimit, config.gasPrice, '' , config.network.testnet.chainId);
    var gasLimit = estimateGas(tx);
    var newTx = constructNewTx(fromAddress, toAddress, amount, gasLimit, config.gasPrice, '' , config.network.mainnet.chainId);
//     var newTx = constructNewTx(fromAddress, toAddress, amount, gasLimit, config.gasPrice, '' , config.network.testnet.chainId);
    var bufferPrivateKey = new Buffer(privateKey, 'hex');
    var signedTx = signRawTx(newTx, bufferPrivateKey);

    return submitTransaction(signedTx);
};

//send entire balance
function sendEntireETH(fromAddress, privateKey, toAddress){

    var tx = constructNewTx(fromAddress, toAddress, config.min, config.gasLimit, config.gasPrice, '' , config.network.mainnet.chainId);
//     var tx = constructNewTx(fromAddress, toAddress, config.min, config.gasLimit, config.gasPrice, '' , config.network.testnet.chainId);
    var gasLimit = estimateGas(tx);
    var amountSend = calAmount(fromAddress, gasLimit, config.gasPrice);
    var newTx = constructNewTx(fromAddress, toAddress, amountSend, gasLimit, config.gasPrice, '' , config.network.mainnet.chainId);
//     var newTx = constructNewTx(fromAddress, toAddress, amountSend, gasLimit, config.gasPrice, '' , config.network.testnet.chainId);
    var bufferPrivateKey = new Buffer(privateKey, 'hex');
    var signedTx = signRawTx(newTx, bufferPrivateKey);

    return submitTransaction(signedTx);
};

function cronJob(wallet){

    return new CronJob({
        cronTime: '*/1 * * * *',

        onTick: function () {
            try {
                    getTokenBalance(wallet.address).then(function (data) {
                        if(data.toNumber() > config.value){
                             sendOMGToken(wallet.address, wallet.privateKey, config.receiverAddress, data)
                                .then(
                                    function (txHash) {
                                        console.log(new Date());
                                        getBalance(wallet.address).then(function (Balance) {    
                                             console.log('balance of this account :' + Balance / Math.pow(10, 18));
                                             console.log('balance token OMG of this account :' + data / Math.pow(10, 18));
                                             console.log('[HASH] transaction hash :' + txHash);        
                                        });
                                    
                                  }  
                                )
                                .catch(
                                    function (e) {
                                        console.log('[ERRO]: ' + new Date()+' '+ 'send transaction error'+e.message.toString());
                                    }
                                )
                        } else {
                            console.log('[ERRO] :  your account shoulde has enough token to transfer');
                        }
                    });

                } catch(e){
                    console.log('[ERRO]: ' + new Date()+' '+ e.message.toString());
                    throw new Error(e);
                }

        },

        start: true
    })
};

function getTokenContractInstance() { 
        var tokenContract = web3().eth.contract(config.tokenABI);
        return tokenContract.at(config.network.mainnet.tokenAddress);
};

//Token balance of address
function getTokenBalance (address) {
    return new Promise(function(resolve, reject) {
        getTokenContractInstance().balanceOf.call(address, function(err, data){
            if (err) reject(err);
            else {
                resolve(data);
            }
        })
    })
};

function sendOMGToken(fromAddress, privateKey, toAddress, amount){
    var payload = getTokenContractInstance().transfer.getData(toAddress, amount);
    var newTx = constructNewTx(fromAddress, config.network.mainnet.tokenAddress, 0, 100000, config.gasPrice, payload , config.network.mainnet.chainId);
    var bufferPrivateKey = new Buffer(privateKey, 'hex');
    var signedTx = signRawTx(newTx, bufferPrivateKey);
    return submitTransaction(signedTx);
};

module.exports = {
    cronJob: cronJob,
    sendETH: sendETH,
    balance: getBalance
}


