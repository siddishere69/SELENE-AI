// === binance.js ===
const Binance = require('node-binance-api');
require('dotenv').config();

const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_API_SECRET
});

// ✅ Candle fetching function
async function getCandles(symbol = 'BTCUSDT', interval = '15m', limit = 100) {
  return new Promise((resolve, reject) => {
    binance.candlesticks(symbol, interval, (error, ticks) => {
      if (error) return reject(error);
      resolve(ticks.map(t => ({
        time: t[0],
        open: t[1],
        high: t[2],
        low: t[3],
        close: t[4],
        volume: t[5]
      })));
    }, { limit });
  });
}

// 🪙 Get full balance (SPOT)
async function getSpotBalance() {
  return new Promise((resolve, reject) => {
    binance.balance((error, balances) => {
      if (error) return reject(error);
      resolve(balances);
    });
  });
}

binance.options({ verbose: true }); // Add in binance.js


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

// ✅ Export all functions
module.exports = {
  getSpotBalance,
  getOpenOrders,
  getRecentTrades,
  getCandles // ← You missed this
};
