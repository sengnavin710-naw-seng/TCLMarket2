import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MarketCard.css';

/** Lightweight SVG sparkline — no library needed */
const Sparkline = ({ yes = 50 }) => {
    // Generate a synthetic price path from 50% → current yes%
    const pts = 10;
    const start = 50;
    const end = yes;
    const points = Array.from({ length: pts }, (_, i) => {
        const t = i / (pts - 1);
        const noise = (Math.sin(i * 2.3 + yes) * 4);
        return start + (end - start) * t + noise;
    });

    const w = 120, h = 36;
    const minV = Math.min(...points);
    const maxV = Math.max(...points);
    const range = maxV - minV || 1;
    const toX = i => (i / (pts - 1)) * w;
    const toY = v => h - ((v - minV) / range) * (h - 4) - 2;
    const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

    const color = yes >= 50 ? '#00c076' : '#f6465d';
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="sparkline">
            <defs>
                <linearGradient id={`sg-${yes}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`${d} L${w},${h} L0,${h} Z`} fill={`url(#sg-${yes})`} />
            <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

const CATEGORY_ICONS = {
    Politics: '🗳️', Sports: '⚽', Crypto: '₿', General: '🌐',
    Finance: '📈', Tech: '💻', Science: '🔬', Entertainment: '🎬'
};

const MarketCard = ({ market, onBet }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const y = Number(market.total_yes ?? 0);
    const n = Number(market.total_no ?? 0);
    const pool = y + n;
    const yPct = pool > 0 ? Math.round((y / pool) * 100) : 50;
    const nPct = 100 - yPct;

    const fmtPool = v => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
    const fmtDate = d => {
        const diff = Math.ceil((new Date(d) - Date.now()) / 86400000);
        if (diff < 0) return 'Ended';
        if (diff === 0) return 'Ends today';
        if (diff <= 7) return `${diff}d left`;
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleBet = (e, side) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) { navigate('/login'); return; }
        onBet?.(market, side);
    };

    const catIcon = CATEGORY_ICONS[market.category] || '🌐';
    const isResolved = market.status === 'resolved';

    return (
        <Link to={`/markets/${market.id}`} className="mkt-card glass-card">
            {/* Top Row */}
            <div className="mkt-card-top">
                <span className="mkt-cat">
                    <span>{catIcon}</span>
                    {market.category || 'General'}
                </span>
                <span className={`pill ${market.status}`}>
                    {market.status === 'open' && <span className="live-dot" />}
                    {market.status}
                </span>
            </div>

            {/* Title */}
            <h3 className="mkt-card-title">{market.title}</h3>

            {/* Probability + Chart */}
            <div className="mkt-card-prob-row">
                <div className="mkt-prob-big">
                    <span className="prob-pct" style={{ color: yPct >= 50 ? 'var(--yes)' : 'var(--no)' }}>
                        {yPct}%
                    </span>
                    <span className="prob-label">chance YES</span>
                </div>
                <Sparkline yes={yPct} />
            </div>

            {/* Odds bar */}
            <div className="mkt-bar">
                <div className="mkt-bar-yes" style={{ width: `${yPct}%` }} />
                <div className="mkt-bar-no" style={{ width: `${nPct}%` }} />
            </div>
            <div className="mkt-bar-labels">
                <span style={{ color: 'var(--yes)' }}>YES {yPct}%</span>
                <span style={{ color: 'var(--no)' }}>NO {nPct}%</span>
            </div>

            {/* Actions */}
            {isResolved ? (
                <div className={`mkt-resolved-banner ${market.result}`}>
                    Result: <strong>{market.result?.toUpperCase()}</strong> ✓
                </div>
            ) : market.status === 'open' ? (
                <div className="mkt-card-actions">
                    <button className="btn-yes mkt-btn" onClick={e => handleBet(e, 'yes')}>
                        YES {yPct}¢
                    </button>
                    <button className="btn-no mkt-btn" onClick={e => handleBet(e, 'no')}>
                        NO {nPct}¢
                    </button>
                </div>
            ) : (
                <div className="mkt-closed-label">{market.status.toUpperCase()}</div>
            )}

            {/* Footer */}
            <div className="mkt-card-footer">
                <span className="mkt-vol">💰 {fmtPool(Number(market.total_pool ?? 0))} pts vol</span>
                <span className="mkt-date">📅 {fmtDate(market.closing_date)}</span>
            </div>
        </Link>
    );
};

export default MarketCard;
