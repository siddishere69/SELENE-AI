// === index.js ===
const express = require('express');
const concepts = require('./concepts');
const backtest = require('./backtest');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const OpenAI = require('openai');
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

// === DB Setup ===
const messageDir = path.join(__dirname, 'message');
if (!fs.existsSync(messageDir)) {
  fs.mkdirSync(messageDir);
}
const adapter = new JSONFile(path.join(messageDir, 'history.json'));
const db = new Low(adapter, { conversation: [] }); // ✅ Fix: Provide defaultData

async function initDB() {
  await db.read();
  db.data ||= { conversation: [] };
  await db.write();
}
initDB();

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// === OpenAI Setup ===
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// === Google Sheets Setup ===
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
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// === ElevenLabs Voice ===
async function getVoiceFromText(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'eVItLK1UvXctxuaRV2Oq';

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.4, similarity_boost: 0.85 }
    })
  });

  if (!response.ok) {
    console.error("❌ ElevenLabs Voice Error:", await response.text());
    return null;
  }

  const audioBuffer = await response.buffer();
  const filename = `selene-${Date.now()}.mp3`;
  const filepath = path.join(__dirname, 'public', filename);
  fs.writeFileSync(filepath, audioBuffer);
  return `/${filename}`;
}

// === Message route ===
app.post('/message', async (req, res) => {
  await db.read();
  const userText = req.body.message || '';
  db.data.conversation.push({ role: 'user', content: userText });
  if (userText.toLowerCase().startsWith('backtest this:')) {
  const concept = userText.split(':')[1]?.trim();
  if (!concept) return res.json({ reply: "Please describe the concept to backtest." });

  const result = backtest.backtestSimpleStrategy(concept);
  return res.json({ reply: result });
}
  // === Save new concept ===
if (userText.toLowerCase().startsWith('add concept:')) {
  const conceptText = userText.split(':')[1]?.trim();
  if (!conceptText) return res.json({ reply: "You need to tell me the concept after 'add concept:'" });

  concepts.saveConcept(conceptText);
  return res.json({ reply: `Got it! Added this to your concept list: "${conceptText}"` });
}

// === Combine all concepts into strategy ===
if (userText.toLowerCase().includes('combine concepts')) {
  const strategy = concepts.generateStrategyFromConcepts();
  return res.json({ reply: strategy });
}

  // === Financial Modeling Prep News API ===
if (userText.toLowerCase().includes('news')) {
  try {
    const newsRes = await axios.get(`https://financialmodelingprep.com/api/v3/stock_news?limit=5&apikey=${process.env.FMP_API_KEY}`);
    const articles = newsRes.data.map(item => `• ${item.title}`).join('\n');
    const reply = `Here are the top 5 financial news headlines right now:\n${articles}`;
    const voiceUrl = await getVoiceFromText(reply);
    return res.json({ reply, voice: voiceUrl || null });
  } catch (err) {
    console.error("FMP News Error:", err.message);
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
      if (tdRes.data.status === "error") {
        return res.json({ reply: `Selene couldn't find ${symbol}. Try another one.` });
      }
      const price = tdRes.data.price;
      const priceReply = `The current price of ${symbol} is $${price}.`;
      const voiceUrl = await getVoiceFromText(priceReply);
      return res.json({ reply: priceReply, voice: voiceUrl || null });
    } catch (err) {
      console.error("TwelveData Error:", err.message);
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

    const voiceUrl = await getVoiceFromText(reply);

    const timestamp = new Date().toLocaleString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Selene!A1",
      valueInputOption: "RAW",
      requestBody: { values: [[timestamp, userText, reply]] }
    });

    return res.json({ reply, voice: voiceUrl || null });
  } catch (err) {
    console.error("❌ GPT Error:", err.response?.data || err.message || err);
    return res.json({ reply: "Selene is having a brain fog moment. Try again soon." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Selene server is live on port ${PORT}`);
});
