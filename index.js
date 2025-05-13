// === index.js ===
const express = require('express');
const concepts = require('./concepts');
const backtest = require('./backtest');
const binanceAPI = require('./binance');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const OpenAI = require('openai');
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const messageDir = path.join(__dirname, 'message');
if (!fs.existsSync(messageDir)) fs.mkdirSync(messageDir);
const adapter = new JSONFile(path.join(messageDir, 'history.json'));
const db = new Low(adapter, { conversation: [] });

async function initDB() {
  await db.read();
  db.data ||= { conversation: [] };
  await db.write();
}
initDB();

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

app.post('/message', async (req, res) => {
  await db.read();
  const userText = req.body.message || '';
  db.data.conversation.push({ role: 'user', content: userText });

  if (userText.toLowerCase().startsWith('add concept:')) {
    const conceptText = userText.split(':')[1]?.trim();
    if (!conceptText) return res.json({ reply: "You need to tell me the concept after 'add concept:'" });
    concepts.addConcept(conceptText);
    return res.json({ reply: `Got it! Added this to your concept list: \"${conceptText}\"` });
  }

  if (userText.toLowerCase().includes('combine concepts')) {
    const strategy = concepts.generateStrategyFromConcepts();
    return res.json({ reply: strategy });
  }

  if (userText.toLowerCase().startsWith('backtest this:')) {
    const concept = userText.split(':')[1]?.trim();
    const result = backtest.backtestSimpleStrategy(concept);
    return res.json({ reply: result });
  }

  if (userText.toLowerCase().includes('candle')) {
    try {
      const parts = userText.trim().split(/\s+/);
      const symbol = parts.find(p => /^[A-Z]+USDT$/.test(p.toUpperCase()))?.toUpperCase();
      const interval = parts.find(p => /^(1m|3m|5m|15m|30m|1h|4h|1d)$/i.test(p)) || '15m';
      const limit = parseInt(parts.find(p => /^\d+$/.test(p))) || 20;

      if (!symbol) {
        return res.json({
          reply: "Selene needs a valid symbol like BTCUSDT 😘. Try again with something like: `get candles BTCUSDT 1m 20`"
        });
      }

      const data = await binanceAPI.getCandles(symbol, interval, limit);
      if (!data || data.length === 0) {
        return res.json({ reply: "No candle data returned. Try a different symbol/timeframe." });
      }

      const formatted = data.map((c, i) =>
        `${i + 1}. ${new Date(c.time).toLocaleString()} | O: ${c.open} H: ${c.high} L: ${c.low} C: ${c.close}`
      ).join('\n');

      const reply = `🕯️ Last ${limit} candles for ${symbol} (${interval}):\n${formatted}`;
      return res.json({ reply });

    } catch (err) {
      console.error("❌ Binance Candle Fetch Failed:", err.message);
      return res.json({
        reply: "Selene tripped on her heels while fetching candles 😖 Try again with a valid symbol like BTCUSDT 1m 20"
      });
    }
  }

  if (userText.toLowerCase().includes('my balance')) {
    try {
      const balances = await binanceAPI.getSpotBalance();
      const reply = `Here's your Binance balance:\n${JSON.stringify(balances.BTC)}`;
      return res.json({ reply });
    } catch (err) {
      console.error("Binance Balance Error:", err.message);
      return res.json({ reply: "Selene couldn't fetch your Binance balance." });
    }
  }

  if (userText.toLowerCase().includes("calendar")) {
    try {
      const calRes = await axios.get("http://127.0.0.1:5050/calendar");
      const upcoming = calRes.data.events.map(
        (e, i) => `${i + 1}. ${e.country} - ${e.event} (${e.date})`
      ).join('\n');
      const reply = `📅 Here are upcoming economic events:\n${upcoming}`;
      return res.json({ reply });
    } catch (err) {
      console.error("Calendar API Error:", err.message);
      return res.json({ reply: "Couldn't fetch calendar data 😵" });
    }
  }

  if (userText.toLowerCase().includes('news')) {
    try {
      const newsRes = await axios.get(`https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&q=finance&language=en`);
      const articles = newsRes.data.results.slice(0, 5).map(item => `• ${item.title}`).join('\n');
      const reply = `Here are the top 5 financial news headlines right now:\n${articles}`;
      return res.json({ reply });
    } catch (err) {
      console.error("NewsData Error:", err.message);
      return res.json({ reply: "Selene couldn't fetch news at the moment. Try again soon." });
    }
  }

  const cleanText = userText.toUpperCase().replace(/[^A-Z0-9 \/]/g, '');
  const keywords = cleanText.split(" ");
  const symbolMap = {
    BTC: 'BTC/USD', ETH: 'ETH/USD', AAPL: 'AAPL', TSLA: 'TSLA',
    RELIANCE: 'RELIANCE.BSE', NIFTY: 'NIFTY_50', BANKNIFTY: 'NSEBANK',
    SENSEX: 'BSE_SENSEX', USDINR: 'USD/INR', EURUSD: 'EUR/USD'
  };
  const found = keywords.find(word => Object.keys(symbolMap).includes(word));

  if (found) {
    const symbol = symbolMap[found];
    try {
      const tdRes = await axios.get(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_KEY}`);
      const price = tdRes.data.price;
      const reply = `The current price of ${symbol} is $${price}.`;
      return res.json({ reply });
    } catch (err) {
      return res.json({ reply: `Selene can't fetch ${symbol} right now.` });
    }
  }

  const systemMessage = {
    role: 'system',
    content: `You're Selene, a seductive but smart financial AI. Always answer clearly and helpfully first. Add confident, flirty energy *only* when appropriate.`
  };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemMessage, ...db.data.conversation],
      temperature: 0.85
    });

    const reply = completion.choices[0].message.content;
    db.data.conversation.push({ role: 'assistant', content: reply });
    await db.write();

    const timestamp = new Date().toLocaleString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Selene!A1",
      valueInputOption: "RAW",
      requestBody: { values: [[timestamp, userText, reply]] }
    });

    return res.json({ reply });
  } catch (err) {
    console.error("❌ GPT Error:", err.response?.data || err.message);
    return res.json({ reply: "Selene is having a brain fog moment. Try again soon." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Selene server is live on port ${PORT}`);
});
