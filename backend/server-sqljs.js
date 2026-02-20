const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('Starting Kate\'s Office server with sql.js...');

// Initialize sql.js
const initSqlJs = require('sql.js');

let db;

async function initDatabase() {
  console.log('Initializing sql.js...');
  const SQL = await initSqlJs();
  console.log('sql.js loaded');
  
  db = new SQL.Database();
  console.log('In-memory database created');
  
  // Run schema
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  console.log('Loading schema from:', schemaPath);
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.run(schema);
  console.log('Schema executed');
  
  return db;
}

async function startServer() {
  await initDatabase();
  
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
      const result = db.exec('SELECT * FROM tasks ORDER BY created_at DESC');
      const tasks = result.length > 0 ? result[0].values.map((row, i) => {
        const cols = result[0].columns;
        return cols.reduce((obj, col, j) => ({ ...obj, [col]: row[j] }), {});
      }) : [];
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/', (req, res) => {
    res.send('Kate\'s Office API');
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
