import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const StatCard = ({ icon, label, value, color }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ color }}>{icon}</div>
        <div className="stat-info">
            <span className="stat-label">{label}</span>
            <strong className="stat-value" style={{ color }}>{value}</strong>
        </div>
    </div>
);

const Profile = () => {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const [bets, setBets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [markets, setMarkets] = useState({});
    const [tab, setTab] = useState('bets');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);

        const [betsRes, txRes] = await Promise.all([
            supabase.from('bets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
            supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        ]);

        const betsData = betsRes.data || [];
        setBets(betsData);
        setTransactions(txRes.data || []);

        // Fetch market titles
        if (betsData.length > 0) {
            const marketIds = [...new Set(betsData.map(b => b.market_id))];
            const { data: mData } = await supabase.from('markets').select('id, title').in('id', marketIds);
            const mMap = {};
            (mData || []).forEach(m => { mMap[m.id] = m.title; });
            setMarkets(mMap);
        }
        setLoading(false);
    };

    // Compute stats
    const totalBets = bets.length;
    const wonBets = bets.filter(b => b.status === 'won').length;
    const lostBets = bets.filter(b => b.status === 'lost').length;
    const pendingBets = bets.filter(b => b.status === 'pending').length;
    const winRate = totalBets > 0 ? ((wonBets / (wonBets + lostBets || 1)) * 100).toFixed(1) : '—';
    const totalWon = bets.filter(b => b.status === 'won').reduce((s, b) => s + Number(b.actual_payout || 0), 0);
    const totalStaked = bets.reduce((s, b) => s + Number(b.stake), 0);

    const statusStyle = { won: '#10b981', lost: '#ef4444', pending: '#f59e0b', refunded: '#6366f1' };
    const txTypeStyle = { deposit: '#10b981', bet: '#ef4444', win: '#6366f1', refund: '#f59e0b' };
    const txTypeIcon = { deposit: '💳', bet: '🎯', win: '🏆', refund: '↩️' };

    const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (!profile) return <div className="profile-loading">Loading profile...</div>;

    return (
        <div className="profile-page">

            {/* Header Card */}
            <div className="profile-header">
                <div className="profile-avatar">
                    {profile.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="profile-info">
                    <h1>{profile.username}</h1>
                    <span className="profile-role">{profile.role === 'admin' ? '🛡️ Admin' : '👤 Member'}</span>
                    <p className="profile-joined">Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="profile-balance-big">
                    <span>Balance</span>
                    <strong>💰 {Number(profile.balance).toFixed(2)}</strong>
                    <small>points</small>
                </div>
                <button className="profile-logout-btn" onClick={handleLogout}>🚪 Logout</button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard icon="🎯" label="Total Bets" value={totalBets} color="#a78bfa" />
                <StatCard icon="🏆" label="Won" value={wonBets} color="#10b981" />
                <StatCard icon="❌" label="Lost" value={lostBets} color="#ef4444" />
                <StatCard icon="⏳" label="Pending" value={pendingBets} color="#f59e0b" />
                <StatCard icon="📈" label="Win Rate" value={`${winRate}%`} color="#6366f1" />
                <StatCard icon="💸" label="Total Staked" value={`${totalStaked.toFixed(0)} pts`} color="#e0e0ff" />
                <StatCard icon="💵" label="Total Won" value={`${totalWon.toFixed(0)} pts`} color="#10b981" />
                <StatCard icon="📊" label="P&L" value={`${(totalWon - totalStaked).toFixed(0)} pts`}
                    color={totalWon - totalStaked >= 0 ? '#10b981' : '#ef4444'} />
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
                <button className={`profile-tab ${tab === 'bets' ? 'active' : ''}`} onClick={() => setTab('bets')}>
                    🎯 Bet History ({totalBets})
                </button>
                <button className={`profile-tab ${tab === 'tx' ? 'active' : ''}`} onClick={() => setTab('tx')}>
                    💳 Transactions ({transactions.length})
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="profile-loading">Loading...</div>
            ) : tab === 'bets' ? (
                bets.length === 0 ? (
                    <div className="empty-state">No bets yet. <a href="/markets">Browse Markets →</a></div>
                ) : (
                    <div className="bet-history">
                        {bets.map(bet => (
                            <div key={bet.id} className="history-row">
                                <div className="history-left">
                                    <span className={`side-tag ${bet.side}`}>{bet.side.toUpperCase()}</span>
                                    <div className="history-title">
                                        <a href={`/markets/${bet.market_id}`}>{markets[bet.market_id] ?? 'Loading...'}</a>
                                        <small>{fmtDate(bet.created_at)}</small>
                                    </div>
                                </div>
                                <div className="history-right">
                                    <div className="history-amounts">
                                        <span>Stake: <strong>{Number(bet.stake).toFixed(0)} pts</strong></span>
                                        <span>→ Potential: <strong>{Number(bet.potential_payout).toFixed(0)} pts</strong></span>
                                        {bet.actual_payout !== null && bet.status !== 'pending' && (
                                            <span>Payout: <strong style={{ color: statusStyle[bet.status] }}>{Number(bet.actual_payout).toFixed(0)} pts</strong></span>
                                        )}
                                    </div>
                                    <span className="bet-status-badge" style={{ background: `${statusStyle[bet.status]}22`, color: statusStyle[bet.status] }}>
                                        {bet.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                transactions.length === 0 ? (
                    <div className="empty-state">No transactions yet.</div>
                ) : (
                    <div className="tx-history">
                        {transactions.map(tx => (
                            <div key={tx.id} className="history-row">
                                <div className="history-left">
                                    <span className="tx-icon">{txTypeIcon[tx.type] ?? '💰'}</span>
                                    <div className="history-title">
                                        <strong style={{ color: txTypeStyle[tx.type] }}>{tx.type.toUpperCase()}</strong>
                                        <span>{tx.description ?? '—'}</span>
                                        <small>{fmtDate(tx.created_at)}</small>
                                    </div>
                                </div>
                                <div className="history-right">
                                    <div className="tx-amounts">
                                        <strong className="tx-amount" style={{ color: tx.amount >= 0 ? '#10b981' : '#ef4444' }}>
                                            {tx.amount >= 0 ? '+' : ''}{Number(tx.amount).toFixed(2)} pts
                                        </strong>
                                        <small>{Number(tx.balance_before).toFixed(0)} → {Number(tx.balance_after).toFixed(0)} pts</small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default Profile;
