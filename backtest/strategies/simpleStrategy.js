// backtest/strategies/simpleStrategy.js

let previous = null;
let wins = 0;
let losses = 0;
let totalPnL = 0;
let candles = [];

const reset = () => {
  previous = null;
  wins = 0;
  losses = 0;
  totalPnL = 0;
  candles = [];
};

const init = (data) => {
  candles = data;
};

const evaluate = (candle, i) => {
  if (!previous) {
    previous = candle;
    return;
  }
  if (candle.close > previous.close) {
    const entry = candle.close;
    const exit = candles[i + 1]?.close || entry;
    const pnl = exit - entry;
    if (pnl > 0) wins++;
    else losses++;
    totalPnL += pnl;
  }
  previous = candle;
};

const getSummary = (conceptName = 'Simple Strategy') => {
  const totalTrades = wins + losses;
  const winRate = totalTrades ? ((wins / totalTrades) * 100).toFixed(2) : 0;
  const avgPnL = totalTrades ? (totalPnL / totalTrades).toFixed(2) : 0;
  return `\n📊 *Backtest Summary for: "${conceptName}"*
• Total Trades: ${totalTrades}
• Win Rate: ${winRate}%
• Net PnL: ${totalPnL.toFixed(2)}
• Avg PnL/Trade: ${avgPnL}
• Status: ${winRate >= 50 ? '✅ Looks promising!' : '⚠️ Needs improvement'}\n`;
};

module.exports = { init, evaluate, getSummary, reset };
