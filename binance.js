// === binance.js ===
const Binance = require('node-binance-api');
require('dotenv').config();

const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_API_SECRET
});

// 🪙 Get full balance (SPOT)
async function getSpotBalance() {
  return new Promise((resolve, reject) => {
    binance.balance((error, balances) => {
      if (error) return reject(error);
      resolve(balances);
    });
  });
}

// 📊 Get open orders for a symbol
async function getOpenOrders(symbol = 'BTCUSDT') {
  return new Promise((resolve, reject) => {
    binance.openOrders(symbol, (error, orders) => {
      if (error) return reject(error);
      resolve(orders);
    });
  });
}

// 📋 Get last 10 trades for a symbol
async function getRecentTrades(symbol = 'BTCUSDT') {
  return new Promise((resolve, reject) => {
    binance.trades(symbol, (error, trades) => {
      if (error) return reject(error);
      resolve(trades);
    });
  });
}

module.exports = {
  getSpotBalance,
  getOpenOrders,
  getRecentTrades
};
