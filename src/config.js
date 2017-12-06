config = {
    gasPrice: 10000000000,
    gasLimit: 200000,
    network: {
        mainnet: {
            chainId: 1,
            url: 'https://api.myetherapi.com/eth',
            tokenAddress : '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07'
        },

        testnet: {
            chainId: 3,
            url: 'https://api.myetherapi.com/rop',
            tokenAddress : '0x7f602918251a760f110fc6956f87a2680967cf05'
        }
    },
    target: 0.1,
    receiverAddress: '0xcb929f3498c9e1c92a2c8fa5fd91aad300bb1f86',
    min: 0.000000000000000001, // 1 wei
    tokenABI : [{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}],
}
module.exports = config;