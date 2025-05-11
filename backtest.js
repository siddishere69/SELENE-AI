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

const backtestSimpleStrategy = (concept) => {
  const candles = generateMockCandles();
  let wins = 0, losses = 0, totalPnL = 0;

  for (let i = 2; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    // Mock entry: if close > prev close = buy
    if (curr.close > prev.close) {
      const entry = curr.close;
      const exit = candles[i + 1]?.close || entry;
      const pnl = exit - entry;

      if (pnl > 0) wins++;
      else losses++;

      totalPnL += pnl;
    }
  }

  const totalTrades = wins + losses;
  const winRate = totalTrades ? ((wins / totalTrades) * 100).toFixed(2) : 0;
  const avgPnL = totalTrades ? (totalPnL / totalTrades).toFixed(2) : 0;

  return `
📊 *Backtest Summary for: "${concept}"*
• Total Trades: ${totalTrades}
• Win Rate: ${winRate}%
• Net PnL: ${totalPnL.toFixed(2)}
• Avg PnL/Trade: ${avgPnL}
• Status: ${winRate >= 50 ? '✅ Looks promising!' : '⚠️ Needs improvement'}
  `;
};

module.exports = {
  backtestSimpleStrategy
};
