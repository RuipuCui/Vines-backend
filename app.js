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

app.use('/api/media', require('./routes/mediaRoutes'));
// app.use('/api/gps', require('./routes/gpsRoutes'));
// app.use('/api/scores', require('./routes/scoreRoutes'));
// app.use('/api/metrics', require('./routes/metricsRoutes'));
// app.use('/api/friends', require('./routes/friendRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));

module.exports = app;