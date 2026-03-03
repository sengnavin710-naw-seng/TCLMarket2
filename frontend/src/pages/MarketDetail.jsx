import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LanguageContext';
import Modal from '../components/Modal';
import './MarketDetail.css';

const OddsBar = ({ yes, no, pool }) => {
    const yPct = pool > 0 ? ((yes / pool) * 100).toFixed(1) : 50;
    const nPct = pool > 0 ? ((no / pool) * 100).toFixed(1) : 50;
    return (
        <div className="detail-odds">
            <div className="detail-odds-bar">
                <div style={{ width: `${yPct}%`, background: 'var(--yes)', height: '100%', borderRadius: '4px 0 0 4px', transition: 'width 0.5s' }} />
                <div style={{ width: `${nPct}%`, background: 'var(--no)', height: '100%', borderRadius: '0 4px 4px 0', transition: 'width 0.5s' }} />
            </div>
            <div className="detail-odds-labels">
                <span style={{ color: 'var(--yes)', fontWeight: 800, fontSize: '1.2rem' }}>YES {yPct}%</span>
                <span style={{ color: 'var(--no)', fontWeight: 800, fontSize: '1.2rem' }}>NO {nPct}%</span>
            </div>
        </div>
    );
};

const MarketDetail = () => {
    const { id } = useParams();
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const { t } = useLang();

    const [market, setMarket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [side, setSide] = useState('yes');
    const [stake, setStake] = useState('');
    const [betting, setBetting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bets', filter: `market_id=eq.${id}` },
                () => { fetchMarket(); fetchMyBets(); })
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

    const handleBet = () => {
        if (!user) return navigate('/login');
        if (!stake || isNaN(stake) || Number(stake) <= 0) {
            toast.error('Enter a valid stake amount');
            return;
        }
        if (Number(stake) > Number(profile?.balance)) {
            toast.error('Insufficient balance 💸');
            return;
        }
        setIsModalOpen(true);
    };

    const confirmBet = async () => {
        setIsModalOpen(false);
        setBetting(true);
        try {
            const { error } = await supabase.rpc('place_bet', {
                p_market_id: id,
                p_side: side,
                p_stake: Number(stake)
            });
            if (error) throw error;
            toast.success(`Bet placed! ${stake} pts on ${side.toUpperCase()} 🎯`);
            setStake('');
            fetchMarket();
            fetchMyBets();
            refreshProfile();
        } catch (err) {
            const msg = err.message || 'Failed to place bet';
            if (msg.includes('INSUFFICIENT_BALANCE')) toast.error('Insufficient balance 💸');
            else if (msg.includes('MARKET_NOT_OPEN')) toast.error('Market is no longer open');
            else toast.error(msg);
        } finally {
            setBetting(false);
        }
    };

    if (loading) return <div className="loading-center">{t.market.loading}</div>;
    if (!market) return <div className="loading-center">{t.market.not_found}</div>;

    const isOpen = market.status === 'open';
    const isResolved = market.status === 'resolved';
    const statusColors = { open: '#10b981', closed: '#f59e0b', resolved: '#6366f1', cancelled: '#ef4444' };

    return (
        <div className="detail-page">
            <div className="detail-container">

                {/* Left: Market Info + Chart */}
                <div className="detail-main">
                    <div className="detail-header-row">
                        {market.image_url && (
                            <div className="detail-image-box">
                                <img src={market.image_url} alt="" className="detail-img-large" />
                            </div>
                        )}
                        <div className="detail-header-content">
                            <div className="detail-meta">
                                <span className="detail-category">{market.category}</span>
                                <span className="detail-status" style={{ color: statusColors[market.status] }}>
                                    ● {market.status.toUpperCase()}
                                </span>
                            </div>
                            <h1 className="detail-title">{market.title}</h1>
                            <p className="detail-desc">{market.description}</p>
                        </div>
                    </div>

                    <OddsBar yes={market.total_yes} no={market.total_no} pool={market.total_pool} />

                    <div className="detail-stats">
                        <div className="stat"><span>{t.market.total_pool}</span><strong>💰 {Number(market.total_pool).toFixed(0)} pts</strong></div>
                        <div className="stat"><span>{t.market.yes_pool}</span><strong style={{ color: '#10b981' }}>{Number(market.total_yes).toFixed(0)} pts</strong></div>
                        <div className="stat"><span>{t.market.no_pool}</span><strong style={{ color: '#ef4444' }}>{Number(market.total_no).toFixed(0)} pts</strong></div>
                        <div className="stat"><span>{t.market.closes}</span><strong>{new Date(market.closing_date).toLocaleDateString()}</strong></div>
                    </div>

                    {isResolved && (
                        <div className={`resolved-banner ${market.result}`}>
                            {t.market.resolved_banner} <strong>{market.result?.toUpperCase()}</strong>
                        </div>
                    )}

                    {/* My Bets */}
                    {myBets.length > 0 && (
                        <div className="my-bets">
                            <h3>{t.market.my_bets}</h3>
                            {myBets.map(bet => (
                                <div key={bet.id} className={`bet-row ${bet.status}`}>
                                    <span className={`bet-side ${bet.side}`}>{bet.side.toUpperCase()}</span>
                                    <span>{Number(bet.stake).toFixed(0)} pts</span>
                                    <span>→ {Number(bet.potential_payout).toFixed(0)} {t.market.potential}</span>
                                    <span className="bet-status">{bet.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Bet Panel */}
                <div className="bet-panel">
                    <h2>{t.market.place_bet}</h2>

                    {!isOpen ? (
                        <p className="market-closed-msg">{t.market.closed_msg.replace('{status}', market.status)}</p>
                    ) : (
                        <>
                            {user && <p className="balance-info">{t.market.balance} <strong>💰 {Number(profile?.balance ?? 0).toFixed(2)} pts</strong></p>}

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
                                <label>{t.market.stake_label}</label>
                                <input type="number" min="1" value={stake} onChange={e => setStake(e.target.value)}
                                    placeholder={t.market.stake_placeholder} className="stake-input" />
                                <div className="quick-bets">
                                    {[10, 50, 100, 500].map(v => (
                                        <button key={v} onClick={() => setStake(String(v))} className="quick-btn">{v}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Payout preview */}
                            {stake && !isNaN(stake) && Number(stake) > 0 && (
                                <div className="payout-preview">
                                    <span>{t.market.potential_payout}</span>
                                    <strong>🎯 {calcPayout()} pts</strong>
                                </div>
                            )}


                            <button onClick={handleBet} disabled={betting} className="bet-submit">
                                {betting ? t.market.placing : t.market.bet_btn.replace('{stake}', stake || '?').replace('{side}', side.toUpperCase())}
                            </button>

                            {!user && (
                                <p className="login-hint">
                                    {t.market.login_hint_pre}<a href="/login">{t.market.login_hint_link1}</a>{t.market.login_hint_mid}<a href="/register">{t.market.login_hint_link2}</a>{t.market.login_hint_post}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* 🎭 Bet Confirmation Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t.market.confirm_title}
                footer={
                    <>
                        <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>{t.market.cancel}</button>
                        <button className={`btn-confirm ${side}`} onClick={confirmBet}>{t.market.confirm_btn}</button>
                    </>
                }
            >
                <div className="confirm-modal-body">
                    <p className="confirm-q">{t.market.confirm_q}</p>
                    <div className="confirm-details">
                        <div className="confirm-item">
                            <span>{t.market.label_market}</span>
                            <strong>{market.title}</strong>
                        </div>
                        <div className="confirm-item">
                            <span>{t.market.label_prediction}</span>
                            <strong className={`side-text ${side}`}>{side.toUpperCase()}</strong>
                        </div>
                        <div className="confirm-item">
                            <span>{t.market.label_stake}</span>
                            <strong>💰 {Number(stake).toLocaleString()} pts</strong>
                        </div>
                        <div className="confirm-item">
                            <span>{t.market.label_potential}</span>
                            <strong className="payout-text">🎯 {calcPayout()} pts</strong>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MarketDetail;
