const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// POST /api/bets — Place a bet
router.post('/', authenticate, async (req, res) => {
    try {
        const { market_id, side, stake } = req.body;
        if (!market_id || !side || !stake) {
            return res.status(400).json({ error: 'market_id, side, and stake are required' });
        }
        if (!['yes', 'no'].includes(side)) {
            return res.status(400).json({ error: 'Side must be yes or no' });
        }
        if (stake <= 0) {
            return res.status(400).json({ error: 'Stake must be greater than 0' });
        }

        // Use Supabase auth context for RPC
        const { createClient } = require('@supabase/supabase-js');
        const userSupabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );

        const { data, error } = await userSupabase.rpc('place_bet', {
            p_market_id: market_id,
            p_side: side,
            p_stake: stake
        });

        if (error) {
            if (error.message.includes('INSUFFICIENT_BALANCE')) {
                return res.status(400).json({ error: 'Insufficient balance' });
            }
            if (error.message.includes('MARKET_NOT_OPEN')) {
                return res.status(400).json({ error: 'Market is not open' });
            }
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to place bet' });
    }
});

// GET /api/bets/my — Get user's bets
router.get('/my', authenticate, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bets')
            .select('*, markets(title, status, result)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bets' });
    }
});

module.exports = router;
