const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

// res
app.get('/', (req, res) => {
  res.send('Vines backend is running');
});

module.exports = app;