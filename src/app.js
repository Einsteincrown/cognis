const express = require('express');
const cors = require('cors');
const path = require('path');
const binanceRoutes = require('./routes/binanceRoutes');
const ventureRoutes = require('./routes/ventureRoutes');

const app = express();
const frontendRoot = path.join(__dirname, '..');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'cognis-binance-backend' });
});

app.use('/api/binance', binanceRoutes);
app.use('/api', ventureRoutes);

app.use(express.static(frontendRoot, { index: false, dotfiles: 'deny' }));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendRoot, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Binance backend error:', err.message);

  const status = err.response?.status || 500;
  const message = err.response?.data?.message || err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    code: err.code || 'INTERNAL_ERROR',
  });
});

module.exports = app;
