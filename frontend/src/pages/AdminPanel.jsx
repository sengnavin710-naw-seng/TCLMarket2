import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const AdminPanel = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [markets, setMarkets] = useState([]);
    const [users, setUsers] = useState([]);
    const [tab, setTab] = useState('markets');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [customAmounts, setCustomAmounts] = useState({}); // { userId: amountString }
    const [uploadingImage, setUploadingImage] = useState(false);
    const [msg, setMsg] = useState(null);
    const fileInputRef = useRef(null);

    // New Market Form
    const [form, setForm] = useState({ title: '', description: '', category: 'General', closing_date: '', image_url: '' });

    useEffect(() => {
        if (!user || profile?.role !== 'admin') { navigate('/'); return; }
        if (tab === 'markets') fetchMarkets();
        if (tab === 'users') fetchUsers();
    }, [user, profile, tab]);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('users').select('*').order('username', { ascending: true });
        if (error) setMsg({ type: 'error', text: error.message });
        setUsers(data || []);
        setLoading(false);
    };

    const fetchMarkets = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('markets').select('*').order('created_at', { ascending: false });
        if (error) setMsg({ type: 'error', text: error.message });
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
            image_url: form.image_url,
            closing_date: new Date(form.closing_date).toISOString(),
            created_by: user.id,
        });
        if (error) {
            setMsg({ type: 'error', text: error.message });
        } else {
            setMsg({ type: 'success', text: '✅ Market created!' });
            setForm({ title: '', description: '', category: 'General', closing_date: '', image_url: '' });
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

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            setMsg({ type: 'error', text: 'Please select an image file' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setMsg({ type: 'error', text: 'Image size must be less than 2MB' });
            return;
        }

        setUploadingImage(true);
        setMsg(null);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `market-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to 'avatars' bucket (using same bucket for simplicity, or create a new 'markets' bucket if preferred)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setForm({ ...form, image_url: publicUrl });
            setMsg({ type: 'success', text: '✨ Image uploaded successfully!' });
        } catch (err) {
            setMsg({ type: 'error', text: err.message || 'Failed to upload image' });
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAddBalance = async (userId, amount, username) => {
        if (!window.confirm(`Add ${amount} units to ${username}?`)) return;
        setSubmitting(true);
        const { error } = await supabase.rpc('add_balance', {
            p_target_user_id: userId,
            p_amount: Number(amount)
        });
        if (error) {
            setMsg({ type: 'error', text: error.message });
        } else {
            setMsg({ type: 'success', text: `✅ Added ${amount} units to ${username}` });
            setCustomAmounts({ ...customAmounts, [userId]: '' }); // Clear input on success
            fetchUsers();
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
                    📊 Markets ({markets.length})
                </button>
                <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
                    👥 Users ({users.length})
                </button>
                <button className={`admin-tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
                    ➕ Create
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
                                <label>Market Image</label>
                                <div className="image-upload-wrap">
                                    <input
                                        type="url"
                                        value={form.image_url}
                                        onChange={e => setForm({ ...form, image_url: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                        className="admin-input"
                                    />
                                    <button
                                        type="button"
                                        className="admin-btn-upload"
                                        onClick={() => fileInputRef.current.click()}
                                        disabled={uploadingImage}
                                    >
                                        {uploadingImage ? '⌛' : '📤 Upload'}
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />
                                {form.image_url && (
                                    <div className="admin-img-preview">
                                        <img src={form.image_url} alt="Preview" />
                                        <button type="button" onClick={() => setForm({ ...form, image_url: '' })} className="preview-remove">×</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-row">
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

            {/* ── Users Management ── */}
            {tab === 'users' && (
                loading ? <div className="admin-loading">Loading users...</div> : (
                    <div className="admin-users">
                        <div className="admin-card no-padding">
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Balance</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className="user-cell">
                                                        <span className="user-username">{u.username}</span>
                                                        <span className="user-email">{u.email}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="balance-cell">
                                                        💰 <strong>{Number(u.balance).toFixed(0)}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="user-actions-custom">
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            className="admin-input-tiny"
                                                            value={customAmounts[u.id] || ''}
                                                            onChange={(e) => setCustomAmounts({
                                                                ...customAmounts,
                                                                [u.id]: e.target.value
                                                            })}
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const amt = Number(customAmounts[u.id]);
                                                                if (!amt || amt <= 0) return;
                                                                handleAddBalance(u.id, amt, u.username);
                                                                // Clear after success (optional, logic inside handleAddBalance is better)
                                                            }}
                                                            disabled={submitting || !customAmounts[u.id]}
                                                            className="admin-btn-add-unit"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default AdminPanel;
