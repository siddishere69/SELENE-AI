// backtest/backtest.js
const EventEmitter = require('events');

class Backtest extends EventEmitter {
  constructor(candles, conceptEvaluator) {
    super();
    this.candles = candles;
    this.evaluate = conceptEvaluator; // Function to process concepts
    this.index = 0;
    this.timer = null;
    this.running = false;
  }

  start(speed = 500) {
    if (this.running || this.index >= this.candles.length) return;
    this.running = true;
    this.timer = setInterval(() => {
      if (this.index >= this.candles.length) {
        this.stop();
        return;
      }
      const candle = this.candles[this.index];
      this.evaluate(candle, this.index);
      this.emit('tick', candle, this.index); // Emit for UI/hooks
      this.index++;
    }, speed);
  }

  pause() {
    clearInterval(this.timer);
    this.running = false;
  }

  reset() {
    this.pause();
    this.index = 0;
  }

  stop() {
    this.pause();
    this.emit('end');
    console.log('Backtest complete');
  }
}

module.exports = Backtest;