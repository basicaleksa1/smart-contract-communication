const express = require('express')
const route = express.Router();


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

route.use(express.json())

route.get('/get-price', (req, res) => {
    fetch(url)
        .then((resp) => resp.json())
        .then(async function(data) {
            let contractprice = await smartContract.methods.getPrice().call()
            setTimeout(() => {
                res.send({ethprice: data.ethereum.usd, contractprice: contractprice})
            }, 1000)
        })
        .catch(function(error) {
            console.log(error);
        });
})
module.exports = route