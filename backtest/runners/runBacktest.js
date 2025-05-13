// backtest/runners/runBacktest.js
const Backtest = require('../backtest');
const strategy = require('../strategies/simpleStrategy');

const generateMockCandles = (count = 100) => {
  let candles = [];
  let price = 100;
  for (let i = 0; i < count; i++) {
    let open = price;
    let close = price + (Math.random() - 0.5) * 10;
    let high = Math.max(open, close) + Math.random() * 5;
    let low = Math.min(open, close) - Math.random() * 5;
    candles.push({ open, high, low, close });
    price = close;
  }
  return candles;
};

const run = () => {
  const candles = generateMockCandles();
  strategy.reset();
  strategy.init(candles);

  const bt = new Backtest(candles, strategy.evaluate);

  bt.on('end', () => {
    console.log(strategy.getSummary('Simple Strategy'));
  });

  bt.start(10); // quick playback
};

run();
