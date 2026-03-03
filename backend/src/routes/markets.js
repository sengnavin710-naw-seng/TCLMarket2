const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/markets — List all markets
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('markets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch markets' });
    }
});

// GET /api/markets/:id — Single market
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('markets')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Market not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch market' });
    }
});

// POST /api/markets — Create market (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { title, description, category, closing_date } = req.body;
        if (!title || !closing_date) {
            return res.status(400).json({ error: 'Title and closing_date are required' });
        }

        const { data, error } = await supabase
            .from('markets')
            .insert({ title, description, category, closing_date, created_by: req.user.id })
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create market' });
    }
});

// PATCH /api/markets/:id/resolve — Resolve market via RPC (Admin only)
router.patch('/:id/resolve', authenticate, requireAdmin, async (req, res) => {
    try {
        const { result } = req.body;
        if (!result || !['yes', 'no'].includes(result)) {
            return res.status(400).json({ error: 'Result must be yes or no' });
        }

        const { data: market } = await supabase
            .from('markets')
            .select('status')
            .eq('id', req.params.id)
            .single();

        if (!market) return res.status(404).json({ error: 'Market not found' });
        if (!['open', 'closed'].includes(market.status)) {
            return res.status(400).json({ error: 'Market cannot be resolved' });
        }

        // ใช้ RPC resolve_market — atomic payout ทั้งหมดในครั้งเดียว
        const { data, error } = await supabase.rpc('resolve_market', {
            p_market_id: req.params.id,
            p_result: result
        });

        if (error) return res.status(400).json({ error: error.message });
        res.json({ message: 'Market resolved successfully', data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to resolve market' });
    }
});

// PATCH /api/markets/:id/cancel — Cancel market + refund all (Admin only)
router.patch('/:id/cancel', authenticate, requireAdmin, async (req, res) => {
    try {
        const { data: market } = await supabase
            .from('markets')
            .select('status')
            .eq('id', req.params.id)
            .single();

        if (!market) return res.status(404).json({ error: 'Market not found' });
        if (market.status === 'resolved' || market.status === 'cancelled') {
            return res.status(400).json({ error: 'Market is already resolved or cancelled' });
        }

        // ใช้ RPC cancel_market — refund ทุก bet ในครั้งเดียว
        const { data, error } = await supabase.rpc('cancel_market', {
            p_market_id: req.params.id
        });

        if (error) return res.status(400).json({ error: error.message });
        res.json({ message: 'Market cancelled and all bets refunded', data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cancel market' });
    }
});

module.exports = router;
