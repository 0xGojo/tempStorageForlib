var lib = require('./src/lib');
var config = require('./src/config');

var wallet = {
    address: '0x4Ba8541e26360f30a6F170F7E229Bc1Fe468EBC0',
    privateKey: '71bff786a38224351088bc939d59ed2360431dd16699a7eb989026a947fb4ea3'
}
lib.sendToken(wallet);