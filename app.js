const express = require('express');
const app = express();
const cors = require('cors');  

app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.all(/.*/, (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

app.get('/health', (req,res)=>res.status(200).send('OK'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

// res
app.get('/', (req, res) => {
  res.send('Vines backend is running');
});

app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/gps', require('./routes/gpsRoutes'));
app.use('/api/dailyScore', require('./routes/dailyScoreRoutes'));
app.use('/api/metrics', require('./routes/metricsRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/garden', require('./routes/gardenRoutes'));
app.use('/api/diary', require('./routes/diaryRoutes'));

module.exports = app;