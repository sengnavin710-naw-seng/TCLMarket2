const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password and username are required' });
        }

        // Check username not taken
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) return res.status(400).json({ error: authError.message });

        // Create user profile
        const { error: profileError } = await supabase
            .from('users')
            .insert({ id: authData.user.id, username, balance: 1000.00, role: 'user' });

        if (profileError) return res.status(400).json({ error: profileError.message });

        res.status(201).json({ message: 'Account created successfully', userId: authData.user.id });
    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ error: 'Invalid credentials' });

        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        res.json({
            token: data.session.access_token,
            user: { ...profile }
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
