const binanceAPI = require('./binance');

(async () => {
  const start = Date.now();
  const candles = await binanceAPI.getCandles("BTCUSDT", "1m", 20);
  const end = Date.now();
  console.log("⏱️ Binance candle fetch time:", end - start, "ms");
  console.log("🔥 Sample candle:", candles[0]);
})();
