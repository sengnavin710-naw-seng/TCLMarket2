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

// PATCH /api/markets/:id/resolve — Resolve market (Admin only)
router.patch('/:id/resolve', authenticate, requireAdmin, async (req, res) => {
    try {
        const { result } = req.body;
        if (!result || !['yes', 'no'].includes(result)) {
            return res.status(400).json({ error: 'Result must be yes or no' });
        }

        const { data: market } = await supabase
            .from('markets')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (!market) return res.status(404).json({ error: 'Market not found' });
        if (market.status !== 'closed' && market.status !== 'open') {
            return res.status(400).json({ error: 'Market cannot be resolved' });
        }

        // Update market status
        await supabase
            .from('markets')
            .update({ status: 'resolved', result, resolved_at: new Date().toISOString() })
            .eq('id', req.params.id);

        // Payout winners
        const { data: bets } = await supabase
            .from('bets')
            .select('*')
            .eq('market_id', req.params.id)
            .eq('status', 'pending');

        for (const bet of bets) {
            if (bet.side === result) {
                await supabase.from('users')
                    .update({ balance: supabase.rpc('increment', { x: bet.potential_payout }) })
                    .eq('id', bet.user_id);

                await supabase.rpc('increment_balance', {
                    p_user_id: bet.user_id,
                    p_amount: bet.potential_payout
                });

                await supabase.from('bets').update({ status: 'won', actual_payout: bet.potential_payout }).eq('id', bet.id);
            } else {
                await supabase.from('bets').update({ status: 'lost', actual_payout: 0 }).eq('id', bet.id);
            }
        }

        res.json({ message: 'Market resolved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to resolve market' });
    }
});

module.exports = router;
