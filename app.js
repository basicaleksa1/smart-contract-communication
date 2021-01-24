const express = require('express')
const app = express()
const coins = require('./routes/coins')
const EthereumTx = require('ethereumjs-tx').Transaction
const Common = require('ethereumjs-common').default
const Web3 = require('web3')
const fetch = require("node-fetch")
const kovantestnet = 'https://kovan.infura.io/v3/2cd65820208443a6a034f10a6ec1d427'
const url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
const contractAbi = [{"inputs":[{"internalType":"uint256","name":"_ethPrice","type":"uint256"}],
    "stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"getLastSetTimestamp",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"getPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
        "stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newPrice",
            "type":"uint256"}],"name":"setEthPrice","outputs":[],"stateMutability":"nonpayable","type":"function"}]
const smartContractAddress = '0xeB23AB1b43B414e15430aA9a33A7915aA81A2268'
const web3 = new Web3(kovantestnet)
const smartContract = new web3.eth.Contract(contractAbi, smartContractAddress)

// dodati vrednosti za ove dve promenljive
let walletAddress = 'wallet address'
let privateKey = Buffer.from('private key', 'hex')

let coinValues = []
let counter = 0

function getAverage(array){
    let sum = 0
    for(let i = 0; i < array.length; i++){
        sum += array[i]
    }
    let newValue = sum / array.length
    return newValue
}

setInterval(() => {
    fetch(url)
        .then((resp) => resp.json())
        .then(async function(data) {
            let newTimestamp = new Date().getTime()
            let oldTimestamp = await smartContract.methods.getLastSetTimestamp().call()
            console.log(counter)
            if(counter >= 15 && newTimestamp - oldTimestamp >= 60000){
                let newPrice = getAverage(coinValues)
                let oldPrice = await smartContract.methods.getPrice().call()
                console.log(oldPrice + 'ovo je stara cena')
                if(newPrice > oldPrice * 102 / 100 || newPrice < oldPrice * 98 / 100) {
                    console.log('treba da se menja cena')
                    let novaCena = Math.round(newPrice)
                    console.log(novaCena)
                    let update = smartContract.methods.setEthPrice(novaCena).encodeABI()
                    web3.eth.getTransactionCount(walletAddress, async (err, txCount) => {
                        let txObject = {
                            from: walletAddress,
                            nonce:    web3.utils.toHex(txCount),
                            to:       smartContractAddress,
                            value:    web3.utils.toHex(web3.utils.toWei('0', 'ether')),
                            gasLimit: web3.utils.toHex(2100000),
                            gasPrice: web3.utils.toHex(web3.utils.toWei('6', 'gwei')),
                            data: update,
                            chainId: '42'
                        }
                        let common = new Common('kovan', 'byzantium')
                        let tx = new EthereumTx(txObject, {common})
                        tx.sign(privateKey)
                        let serializedTx = tx.serialize()
                        let raw = '0x' + serializedTx.toString('hex')

                        let transaction = await web3.eth.sendSignedTransaction(raw)
                    })
                }
                coinValues = []
                counter = 0
            }
            else{
                let coinValue = data.ethereum.usd
                coinValues.push(coinValue)
                counter = counter + 1
            }
        })
        .catch(function(error) {
            console.log(error);
        });
}, 60000)

app.use('/api', coins)

app.listen(8888)