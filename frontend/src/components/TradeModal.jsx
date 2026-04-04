import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import './TradeModal.css';

const TradeModal = ({ market, initialSide = 'yes', onClose, onSuccess }) => {
    const { user, profile, refreshProfile } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [side, setSide] = useState(initialSide);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const y = Number(market.total_yes ?? 0);
    const n = Number(market.total_no ?? 0);
    const pool = y + n;
    const yPct = pool > 0 ? Math.round((y / pool) * 100) : 50;
    const nPct = 100 - yPct;

    const price = side === 'yes'
        ? (pool > 0 ? Math.max(y / pool, 0.01) : 0.5)
        : (pool > 0 ? Math.max(n / pool, 0.01) : 0.5);

    const priceCents = Math.round(price * 100);
    const payout = amount && !isNaN(amount) && Number(amount) > 0
        ? (Number(amount) / price).toFixed(2)
        : '0.00';
    const profit = amount && !isNaN(amount) && Number(amount) > 0
        ? (Number(payout) - Number(amount)).toFixed(2)
        : '0.00';

    const balance = Number(profile?.balance ?? 0);
    const notEnough = Number(amount) > balance;

    const handleSubmit = async () => {
        if (!user) { navigate('/login'); return; }
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            toast.error('Enter a valid amount'); return;
        }
        if (notEnough) { toast.error('Insufficient balance 💸'); return; }

        setLoading(true);
        try {
            await api.post('/bets', {
                market_id: market.id,
                side,
                stake: Number(amount)
            });
            toast.success(`✅ Bet placed! ${amount} pts on ${side.toUpperCase()}`);
            refreshProfile();
            onSuccess?.();
            onClose();
        } catch (err) {
            const msg = err.response?.data?.error || err.message || '';
            if (msg.includes('INSUFFICIENT_BALANCE') || msg.includes('Insufficient')) toast.error('Insufficient balance 💸');
            else if (msg.includes('MARKET_NOT_OPEN') || msg.includes('not open')) toast.error('Market is no longer open');
            else toast.error(msg || 'Failed to place bet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trade-overlay" onClick={onClose}>
            <div className="trade-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="trade-header">
                    <div>
                        <div className="trade-market-name">{market.title}</div>
                        <div className="trade-subtitle">Place a prediction</div>
                    </div>
                    <button className="trade-close" onClick={onClose}>✕</button>
                </div>

                {/* Side Selector */}
                <div className="trade-sides">
                    <button
                        className={`trade-side yes ${side === 'yes' ? 'active' : ''}`}
                        onClick={() => setSide('yes')}
                    >
                        <span className="side-label">YES</span>
                        <span className="side-price">{yPct}¢</span>
                    </button>
                    <button
                        className={`trade-side no ${side === 'no' ? 'active' : ''}`}
                        onClick={() => setSide('no')}
                    >
                        <span className="side-label">NO</span>
                        <span className="side-price">{nPct}¢</span>
                    </button>
                </div>

                {/* Amount Input */}
                <div className="trade-input-section">
                    <div className="trade-input-label">
                        <span>Amount (pts)</span>
                        {user && <span className="trade-balance">Balance: {balance.toLocaleString()} pts</span>}
                    </div>
                    <div className={`trade-input-wrap ${notEnough ? 'error' : ''}`}>
                        <span className="trade-pts-icon">💰</span>
                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0"
                            className="trade-input"
                            id="trade-amount-input"
                            autoFocus
                        />
                    </div>
                    {notEnough && <span className="trade-error-msg">Insufficient balance</span>}

                    {/* Quick amounts */}
                    <div className="trade-quick">
                        {[10, 50, 100, 250, 500].map(v => (
                            <button key={v} className={`trade-quick-btn ${Number(amount) === v ? 'active' : ''}`}
                                onClick={() => setAmount(String(v))}>
                                {v}
                            </button>
                        ))}
                        {balance > 0 && (
                            <button className="trade-quick-btn" onClick={() => setAmount(String(Math.floor(balance)))}>
                                MAX
                            </button>
                        )}
                    </div>
                </div>

                {/* Payout Preview */}
                <div className="trade-preview">
                    <div className="trade-preview-row">
                        <span>Price per share</span>
                        <span style={{ color: side === 'yes' ? 'var(--yes)' : 'var(--no)' }}>
                            {priceCents}¢
                        </span>
                    </div>
                    <div className="trade-preview-row">
                        <span>Potential payout</span>
                        <strong>{Number(payout).toLocaleString()} pts</strong>
                    </div>
                    <div className="trade-preview-row profit">
                        <span>Potential profit</span>
                        <strong style={{ color: 'var(--yes)' }}>+{Number(profit).toLocaleString()} pts</strong>
                    </div>
                </div>

                {/* Submit */}
                <button
                    className={`trade-submit ${side}`}
                    onClick={handleSubmit}
                    disabled={loading || !amount || notEnough}
                >
                    {loading ? 'Placing bet...' : `Buy ${side.toUpperCase()} ${amount ? `• ${amount} pts` : ''}`}
                </button>

                {!user && (
                    <p className="trade-login-hint">
                        <a href="/login">Login</a> or <a href="/register">Sign up</a> to place bets
                    </p>
                )}
            </div>
        </div>
    );
};

export default TradeModal;
