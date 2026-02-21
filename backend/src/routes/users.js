const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/users/me — Get own profile
router.get('/me', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, balance, role, created_at')
            .eq('id', req.user.id)
            .single();

        if (error) return res.status(404).json({ error: 'User not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// GET /api/users/me/transactions — Get transaction history
router.get('/me/transactions', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('username, balance')
            .order('balance', { ascending: false })
            .limit(10);

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;
