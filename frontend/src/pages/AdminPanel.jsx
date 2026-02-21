import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const AdminPanel = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [markets, setMarkets] = useState([]);
    const [tab, setTab] = useState('markets');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState(null);

    // New Market Form
    const [form, setForm] = useState({ title: '', description: '', category: 'General', closing_date: '' });

    useEffect(() => {
        if (!user || profile?.role !== 'admin') { navigate('/'); return; }
        fetchMarkets();
    }, [user, profile]);

    const fetchMarkets = async () => {
        setLoading(true);
        const { data } = await supabase.from('markets').select('*').order('created_at', { ascending: false });
        setMarkets(data || []);
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title || !form.closing_date) {
            setMsg({ type: 'error', text: 'Title and closing date are required' });
            return;
        }
        setSubmitting(true);
        setMsg(null);
        const { error } = await supabase.from('markets').insert({
            title: form.title,
            description: form.description,
            category: form.category,
            closing_date: new Date(form.closing_date).toISOString(),
            created_by: user.id,
        });
        if (error) {
            setMsg({ type: 'error', text: error.message });
        } else {
            setMsg({ type: 'success', text: '✅ Market created!' });
            setForm({ title: '', description: '', category: 'General', closing_date: '' });
            fetchMarkets();
        }
        setSubmitting(false);
    };

    const handleStatusChange = async (marketId, newStatus) => {
        await supabase.from('markets').update({ status: newStatus }).eq('id', marketId);
        fetchMarkets();
    };

    const handleResolve = async (marketId, result) => {
        if (!window.confirm(`Resolve market as ${result.toUpperCase()}? This will pay out all winners.`)) return;
        setSubmitting(true);
        setMsg(null);

        // Call SECURITY DEFINER RPC — bypasses RLS, handles all payouts atomically
        const { data, error } = await supabase.rpc('resolve_market', {
            p_market_id: marketId,
            p_result: result,
        });

        if (error) {
            const errMsg = error.message || 'Failed to resolve market';
            if (errMsg.includes('NOT_AUTHORIZED')) setMsg({ type: 'error', text: 'Not authorized' });
            else if (errMsg.includes('MARKET_NOT_FOUND_OR_NOT_CLOSED')) setMsg({ type: 'error', text: 'Market must be CLOSED before resolving' });
            else setMsg({ type: 'error', text: errMsg });
        } else {
            setMsg({
                type: 'success',
                text: `✅ Resolved as ${result.toUpperCase()}! 🏆 ${data.winners} winner(s) paid ${Number(data.total_payout).toFixed(0)} pts total`
            });
            fetchMarkets();
        }
        setSubmitting(false);
    };

    const categories = ['General', 'Crypto', 'Sports', 'Politics', 'Technology', 'Entertainment'];
    const statusColor = { open: '#10b981', closed: '#f59e0b', resolved: '#6366f1', cancelled: '#ef4444' };
    const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>🛡️ Admin Panel</h1>
                <p>Manage markets and resolve outcomes</p>
            </div>

            <div className="admin-tabs">
                <button className={`admin-tab ${tab === 'markets' ? 'active' : ''}`} onClick={() => setTab('markets')}>
                    📊 Manage Markets ({markets.length})
                </button>
                <button className={`admin-tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
                    ➕ Create Market
                </button>
            </div>

            {msg && (
                <div className={`admin-msg ${msg.type}`}>{msg.text}</div>
            )}

            {/* ── Create Market Form ── */}
            {tab === 'create' && (
                <div className="admin-card">
                    <h2>Create New Market</h2>
                    <form onSubmit={handleCreate} className="create-form">
                        <div className="form-group">
                            <label>Market Title *</label>
                            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g. Will Bitcoin exceed $200,000 by end of 2026?" className="admin-input" required />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe the resolution criteria..." className="admin-input admin-textarea" rows={3} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="admin-input">
                                    {categories.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Closing Date *</label>
                                <input type="datetime-local" value={form.closing_date} onChange={e => setForm({ ...form, closing_date: e.target.value })}
                                    className="admin-input" required />
                            </div>
                        </div>
                        <button type="submit" disabled={submitting} className="admin-btn-primary">
                            {submitting ? 'Creating...' : '➕ Create Market'}
                        </button>
                    </form>
                </div>
            )}

            {/* ── Markets List ── */}
            {tab === 'markets' && (
                loading ? <div className="admin-loading">Loading...</div> : (
                    <div className="admin-markets">
                        {markets.map(m => (
                            <div key={m.id} className="admin-market-row">
                                <div className="admin-market-info">
                                    <div className="admin-market-top">
                                        <span className="admin-category">{m.category}</span>
                                        <span className="admin-status" style={{ color: statusColor[m.status] }}>● {m.status.toUpperCase()}</span>
                                    </div>
                                    <h3 className="admin-market-title">{m.title}</h3>
                                    <div className="admin-market-stats">
                                        <span>💰 Pool: {Number(m.total_pool).toFixed(0)} pts</span>
                                        <span>📅 Closes: {fmtDate(m.closing_date)}</span>
                                        {m.result && <span className={`result-chip ${m.result}`}>Result: {m.result.toUpperCase()}</span>}
                                    </div>
                                </div>

                                <div className="admin-actions">
                                    {m.status === 'open' && (
                                        <button onClick={() => handleStatusChange(m.id, 'closed')} className="admin-btn admin-btn-warn">
                                            🔒 Close Market
                                        </button>
                                    )}
                                    {m.status === 'closed' && (
                                        <>
                                            <button onClick={() => handleStatusChange(m.id, 'open')} className="admin-btn admin-btn-secondary">
                                                🔓 Reopen
                                            </button>
                                            <button onClick={() => handleResolve(m.id, 'yes')} disabled={submitting} className="admin-btn admin-btn-yes">
                                                ✅ Resolve YES
                                            </button>
                                            <button onClick={() => handleResolve(m.id, 'no')} disabled={submitting} className="admin-btn admin-btn-no">
                                                ❌ Resolve NO
                                            </button>
                                        </>
                                    )}
                                    {m.status === 'open' && (
                                        <button onClick={() => handleStatusChange(m.id, 'cancelled')} className="admin-btn admin-btn-danger">
                                            🚫 Cancel
                                        </button>
                                    )}
                                    {(m.status === 'resolved' || m.status === 'cancelled') && (
                                        <span className="admin-btn-done">Finalized</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default AdminPanel;
