const express = require('express');
const http = require('http');

console.log('Test server starting...');

const app = express();
const server = http.createServer(app);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Kate\'s Office - Test Server');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});
