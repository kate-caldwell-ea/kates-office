const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

console.log('Starting Kate\'s Office simple server...');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Use in-memory database
let db;
try {
  console.log('Creating in-memory database...');
  db = new Database(':memory:');
  console.log('Database created');
  
  // Run schema
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  console.log('Schema path:', schemaPath);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('Schema executed');
} catch (error) {
  console.error('Database error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tasks endpoint
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
});
