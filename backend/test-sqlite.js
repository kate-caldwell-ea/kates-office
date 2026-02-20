console.log('Testing better-sqlite3...');

try {
  const Database = require('better-sqlite3');
  console.log('Module loaded successfully');
  
  const db = new Database(':memory:');
  console.log('In-memory database created');
  
  db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY)');
  console.log('Table created');
  
  db.close();
  console.log('Test complete - better-sqlite3 works!');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Now start a simple server
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
