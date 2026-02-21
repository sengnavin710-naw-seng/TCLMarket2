require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/markets', require('./routes/markets'));
app.use('/api/bets', require('./routes/bets'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'TCLMarket2 Backend Running', time: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`TCLMarket2 Backend running on port ${PORT}`);
});
