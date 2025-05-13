// concepts.js
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'concepts.json');

// Load existing concepts
function loadConcepts() {
  try {
    const data = fs.readFileSync(FILE_PATH);
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Save concepts to file
function saveConcepts(concepts) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(concepts, null, 2));
}

// Add a new concept
function addConcept(name, description, logic) {
  const concepts = loadConcepts();
  const existing = concepts.find(c => c.name === name);
  if (existing) return { success: false, message: 'Concept already exists' };
  concepts.push({ name, description, logic, createdAt: new Date().toISOString() });
  saveConcepts(concepts);
  return { success: true, message: 'Concept added' };
}

// Get all concepts
function listConcepts() {
  return loadConcepts();
}

// Delete a concept
function deleteConcept(name) {
  let concepts = loadConcepts();
  const originalLength = concepts.length;
  concepts = concepts.filter(c => c.name !== name);
  saveConcepts(concepts);
  return { deleted: originalLength - concepts.length };
}

module.exports = {
  addConcept,
  listConcepts,
  deleteConcept
};
