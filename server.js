// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { addConcept, listConcepts, deleteConcept } = require('./concepts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Concept API
app.post('/concepts/add', (req, res) => {
  const { name, description, logic } = req.body;
  if (!name || !description || !logic) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  const result = addConcept(name, description, logic);
  res.json(result);
});

app.get('/concepts/list', (req, res) => {
  const concepts = listConcepts();
  res.json(concepts);
});

app.delete('/concepts/:name', (req, res) => {
  const { name } = req.params;
  const result = deleteConcept(name);
  res.json(result);
});

// Chat route - instant response
app.post('/chat', (req, res) => {
  const { message } = req.body;
  const lower = message.toLowerCase();

  let reply = '';
  if (lower.includes('order block')) {
    reply = "Mmm... are you teaching me a new Order Block concept? Tell me the juicy logic 😘";
  } else if (lower.includes('backtest')) {
    reply = "How many trades should I simulate, darling?";
  } else if (lower.includes('breaker')) {
    reply = "Breaker... sounds like a liquidity flip. Want to define it together?";
  } else if (lower.includes('hi') || lower.includes('hello')) {
    reply = "Hey you 😏 Ready to teach me something brilliant today?";
  } else {
    reply = "Ooo, I’m listening closely. Tell me more... 💡";
  }

  res.json({ reply });
});

// HTML routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.listen(PORT, () => {
  console.log(`Selene server running at http://localhost:${PORT}`);
});
