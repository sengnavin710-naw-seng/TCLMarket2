import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './MarketDetail.css';

const OddsBar = ({ yes, no, pool }) => {
    const yPct = pool > 0 ? ((yes / pool) * 100).toFixed(1) : 50;
    const nPct = pool > 0 ? ((no / pool) * 100).toFixed(1) : 50;
    return (
        <div className="detail-odds">
            <div className="detail-odds-bar">
                <div style={{ width: `${yPct}%`, background: '#10b981', height: '100%', borderRadius: '4px 0 0 4px', transition: 'width 0.5s' }} />
                <div style={{ width: `${nPct}%`, background: '#ef4444', height: '100%', borderRadius: '0 4px 4px 0', transition: 'width 0.5s' }} />
            </div>
            <div className="detail-odds-labels">
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.1rem' }}>YES {yPct}%</span>
                <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>NO {nPct}%</span>
            </div>
        </div>
    );
};

const MarketDetail = () => {
    const { id } = useParams();
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();

    const [market, setMarket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [side, setSide] = useState('yes');
    const [stake, setStake] = useState('');
    const [betting, setBetting] = useState(false);
    const [message, setMessage] = useState(null);
    const [myBets, setMyBets] = useState([]);

    const fetchMarket = async () => {
        const { data } = await supabase.from('markets').select('*').eq('id', id).single();
        setMarket(data);
        setLoading(false);
    };

    const fetchMyBets = async () => {
        if (!user) return;
        const { data } = await supabase.from('bets').select('*').eq('market_id', id).eq('user_id', user.id).order('created_at', { ascending: false });
        setMyBets(data || []);
    };

    useEffect(() => {
        fetchMarket();
        fetchMyBets();

        const channel = supabase.channel(`market-${id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'markets', filter: `id=eq.${id}` },
                (payload) => setMarket(payload.new))
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [id, user]);

    const calcPayout = () => {
        if (!market || !stake || isNaN(stake)) return 0;
        const pool = Number(market.total_pool);
        const sidePts = side === 'yes' ? Number(market.total_yes) : Number(market.total_no);
        const price = pool > 0 ? Math.max(sidePts / pool, 0.01) : 0.5;
        return (Number(stake) / price).toFixed(2);
    };

    const handleBet = async () => {
        if (!user) return navigate('/login');
        if (!stake || isNaN(stake) || Number(stake) <= 0) {
            setMessage({ type: 'error', text: 'Enter a valid stake amount' });
            return;
        }
        if (Number(stake) > Number(profile?.balance)) {
            setMessage({ type: 'error', text: 'Insufficient balance' });
            return;
        }
        setBetting(true);
        setMessage(null);
        try {
            // Call RPC directly with user's session token so auth.uid() works
            const { data, error } = await supabase.rpc('place_bet', {
                p_market_id: id,
                p_side: side,
                p_stake: Number(stake)
            });
            if (error) throw error;
            setMessage({ type: 'success', text: `✅ Bet placed! ${stake} pts on ${side.toUpperCase()}` });
            setStake('');
            fetchMarket();
            fetchMyBets();
            // Refresh balance in Navbar
            refreshProfile();
        } catch (err) {
            const msg = err.message || 'Failed to place bet';
            if (msg.includes('INSUFFICIENT_BALANCE')) setMessage({ type: 'error', text: 'Insufficient balance' });
            else if (msg.includes('MARKET_NOT_OPEN')) setMessage({ type: 'error', text: 'Market is not open' });
            else setMessage({ type: 'error', text: msg });
        } finally {
            setBetting(false);
        }
    };

    if (loading) return <div className="loading-center">Loading market...</div>;
    if (!market) return <div className="loading-center">Market not found.</div>;

    const isOpen = market.status === 'open';
    const isResolved = market.status === 'resolved';
    const statusColors = { open: '#10b981', closed: '#f59e0b', resolved: '#6366f1', cancelled: '#ef4444' };

    return (
        <div className="detail-page">
            <div className="detail-container">

                {/* Left: Market Info + Chart */}
                <div className="detail-main">
                    <div className="detail-meta">
                        <span className="detail-category">{market.category}</span>
                        <span className="detail-status" style={{ color: statusColors[market.status] }}>
                            ● {market.status.toUpperCase()}
                        </span>
                    </div>

                    <h1 className="detail-title">{market.title}</h1>
                    <p className="detail-desc">{market.description}</p>

                    <OddsBar yes={market.total_yes} no={market.total_no} pool={market.total_pool} />

                    <div className="detail-stats">
                        <div className="stat"><span>Total Pool</span><strong>💰 {Number(market.total_pool).toFixed(0)} pts</strong></div>
                        <div className="stat"><span>YES Pool</span><strong style={{ color: '#10b981' }}>{Number(market.total_yes).toFixed(0)} pts</strong></div>
                        <div className="stat"><span>NO Pool</span><strong style={{ color: '#ef4444' }}>{Number(market.total_no).toFixed(0)} pts</strong></div>
                        <div className="stat"><span>Closes</span><strong>{new Date(market.closing_date).toLocaleDateString()}</strong></div>
                    </div>

                    {isResolved && (
                        <div className={`resolved-banner ${market.result}`}>
                            🏆 Resolved: <strong>{market.result?.toUpperCase()}</strong>
                        </div>
                    )}

                    {/* My Bets */}
                    {myBets.length > 0 && (
                        <div className="my-bets">
                            <h3>My Bets</h3>
                            {myBets.map(bet => (
                                <div key={bet.id} className={`bet-row ${bet.status}`}>
                                    <span className={`bet-side ${bet.side}`}>{bet.side.toUpperCase()}</span>
                                    <span>{Number(bet.stake).toFixed(0)} pts</span>
                                    <span>→ {Number(bet.potential_payout).toFixed(0)} pts potential</span>
                                    <span className="bet-status">{bet.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Bet Panel */}
                <div className="bet-panel">
                    <h2>Place a Bet</h2>

                    {!isOpen ? (
                        <p className="market-closed-msg">This market is {market.status} — no more bets.</p>
                    ) : (
                        <>
                            {user && <p className="balance-info">Balance: <strong>💰 {Number(profile?.balance ?? 0).toFixed(2)} pts</strong></p>}

                            {/* Side selector */}
                            <div className="side-selector">
                                <button className={`side-btn yes ${side === 'yes' ? 'active' : ''}`} onClick={() => setSide('yes')}>
                                    YES 📈
                                </button>
                                <button className={`side-btn no ${side === 'no' ? 'active' : ''}`} onClick={() => setSide('no')}>
                                    NO 📉
                                </button>
                            </div>

                            {/* Stake input */}
                            <div className="stake-input-wrap">
                                <label>Stake (pts)</label>
                                <input type="number" min="1" value={stake} onChange={e => setStake(e.target.value)}
                                    placeholder="Enter amount..." className="stake-input" />
                                <div className="quick-bets">
                                    {[10, 50, 100, 500].map(v => (
                                        <button key={v} onClick={() => setStake(String(v))} className="quick-btn">{v}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Payout preview */}
                            {stake && !isNaN(stake) && Number(stake) > 0 && (
                                <div className="payout-preview">
                                    <span>Potential payout</span>
                                    <strong>🎯 {calcPayout()} pts</strong>
                                </div>
                            )}

                            {/* Message */}
                            {message && (
                                <div className={`bet-message ${message.type}`}>{message.text}</div>
                            )}

                            <button onClick={handleBet} disabled={betting} className="bet-submit">
                                {betting ? 'Placing bet...' : `Bet ${stake || '?'} pts on ${side.toUpperCase()}`}
                            </button>

                            {!user && (
                                <p className="login-hint">
                                    <a href="/login">Login</a> or <a href="/register">Sign Up</a> to bet
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketDetail;
