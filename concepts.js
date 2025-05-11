// === concepts.js ===
const fs = require('fs');
const path = require('path');

const conceptsPath = path.join(__dirname, 'message', 'concepts.json');

// Load existing concepts from file
function loadConcepts() {
  try {
    if (!fs.existsSync(conceptsPath)) {
      fs.writeFileSync(conceptsPath, JSON.stringify([]));
    }
    const raw = fs.readFileSync(conceptsPath);
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error loading concepts:", err);
    return [];
  }
}

// Save concepts back to file
function saveConcepts(concepts) {
  try {
    fs.writeFileSync(conceptsPath, JSON.stringify(concepts, null, 2));
  } catch (err) {
    console.error("Error saving concepts:", err);
  }
}

// Add a new basic concept
function addConcept(description, strategyName = "Unnamed") {
  const concepts = loadConcepts();
  const newConcept = {
    id: Date.now(),
    name: strategyName,
    description: description.trim(),
    createdAt: new Date().toISOString()
  };
  concepts.push(newConcept);
  saveConcepts(concepts);
  return newConcept;
}

// Add a structured concept
function addConceptStructured({ name, entry, confirmation, stoploss, target }) {
  const concepts = loadConcepts();
  const structured = {
    id: Date.now(),
    name: name || "Unnamed",
    entry: entry || "",
    confirmation: confirmation || "",
    stoploss: stoploss || "",
    target: target || "",
    createdAt: new Date().toISOString()
  };
  concepts.push(structured);
  saveConcepts(concepts);
  return structured;
}

// Combine all saved concepts into a readable strategy
function generateStrategyFromConcepts() {
  const concepts = loadConcepts();
  if (concepts.length === 0) return "You have no concepts yet.";

  const steps = concepts.map((c, i) => {
    if (c.description) {
      return `${i + 1}. ${c.description}`;
    } else {
      return `${i + 1}. ${c.name}\n   Entry: ${c.entry}\n   Confirmation: ${c.confirmation}\n   Stop Loss: ${c.stoploss}\n   Target: ${c.target}`;
    }
  });

  return `Here's a combined strategy using your saved concepts:\n` + steps.join('\n');
}

module.exports = {
  loadConcepts,
  saveConcepts,
  addConcept,
  addConceptStructured,
  generateStrategyFromConcepts
};
