// === concepts.js ===
const fs = require('fs');
const path = require('path');

const conceptsPath = path.join(__dirname, 'message', 'concepts.json');

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

function saveConcepts(concepts) {
  try {
    fs.writeFileSync(conceptsPath, JSON.stringify(concepts, null, 2));
  } catch (err) {
    console.error("Error saving concepts:", err);
  }
}

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

module.exports = { loadConcepts, saveConcepts, addConcept };
