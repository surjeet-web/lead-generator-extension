const fs = require('fs');

// Read the JSON file
const data = JSON.parse(fs.readFileSync('assets/it jobs.json', 'utf8'));

console.log(`Original entries: ${data.length}`);

// Create a Set to track unique entries
const uniqueEntries = new Map();

// Process each entry
data.forEach(entry => {
  // Create a unique key based on all fields
  const key = JSON.stringify({
    category: entry.category,
    sector: entry.sector,
    role: entry.role,
    location: entry.location,
    platform: entry.platform,
    query: entry.query,
    intent_note: entry.intent_note
  });
  
  // Only add if we haven't seen this exact combination before
  if (!uniqueEntries.has(key)) {
    uniqueEntries.set(key, entry);
  }
});

// Convert back to array
const uniqueArray = Array.from(uniqueEntries.values());

console.log(`Unique entries: ${uniqueArray.length}`);
console.log(`Removed duplicates: ${data.length - uniqueArray.length}`);

// Write the cleaned data back to the file
fs.writeFileSync('assets/it jobs.json', JSON.stringify(uniqueArray, null, 2));

console.log('Duplicates removed successfully!');