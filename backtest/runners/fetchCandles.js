// backtest/runners/fetchCandles.js

const axios = require('axios');

/**
 * Fetch historical candlestick data from Binance.
 * @param {string} symbol - Trading pair symbol (e.g., 'BTCUSDT').
 * @param {string} interval - Candlestick interval (e.g., '1m', '5m', '1h').
 * @param {number} limit - Number of candlesticks to retrieve (max 1000).
 * @returns {Promise<Array>} - Array of candlestick objects.
 */
async function fetchCandles(symbol = 'BTCUSDT', interval = '1m', limit = 100) {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: {
        symbol,
        interval,
        limit,
      },
    });

    // Transform the data into desired format
    const candles = response.data.map((candle) => ({
      openTime: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      closeTime: candle[6],
    }));

    return candles;
  } catch (error) {
    console.error('Error fetching candles:', error.message);
    return [];
  }
}

module.exports = { fetchCandles };
