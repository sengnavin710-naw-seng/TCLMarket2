import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './TrendingCarousel.css';

const TrendingCarousel = () => {
    const [markets, setMarkets] = useState([]);
    const [idx, setIdx] = useState(0);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        supabase
            .from('markets')
            .select('*')
            .eq('status', 'open')
            .order('total_pool', { ascending: false })
            .limit(5)
            .then(({ data }) => setMarkets(data || []));
    }, []);

    useEffect(() => {
        if (markets.length < 2) return;
        const t = setInterval(() => goNext(), 5500);
        return () => clearInterval(t);
    }, [markets, idx]);

    const goTo = (i) => {
        if (animating) return;
        setAnimating(true);
        setTimeout(() => { setIdx(i); setAnimating(false); }, 300);
    };
    const goNext = () => goTo((idx + 1) % markets.length);
    const goPrev = () => goTo((idx - 1 + markets.length) % markets.length);

    if (markets.length === 0) return null;
    const m = markets[idx];
    const y = Number(m.total_yes ?? 0);
    const n = Number(m.total_no ?? 0);
    const pool = y + n;
    const yPct = pool > 0 ? Math.round((y / pool) * 100) : 50;

    return (
        <div className="carousel">
            <div className={`carousel-inner ${animating ? 'fade-out' : 'fade-in'}`}>
                <Link to={`/markets/${m.id}`} className="carousel-content">
                    {/* Left */}
                    <div className="carousel-left">
                        <span className="carousel-badge">🔥 Trending</span>
                        <span className="carousel-cat">{m.category}</span>
                        <h2 className="carousel-title">{m.title}</h2>
                        {m.description && (
                            <p className="carousel-desc">{m.description.slice(0, 140)}{m.description.length > 140 ? '…' : ''}</p>
                        )}
                        <div className="carousel-meta">
                            <span>💰 {Number(m.total_pool ?? 0).toLocaleString()} pts vol</span>
                            <span>📅 {new Date(m.closing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    </div>

                    {/* Right — Big % */}
                    <div className="carousel-right">
                        <div className="carousel-pct-wrap">
                            <div className="carousel-pct" style={{ color: yPct >= 50 ? 'var(--yes)' : 'var(--no)' }}>
                                {yPct}%
                            </div>
                            <div className="carousel-pct-label">chance YES</div>
                        </div>

                        <div className="carousel-bar">
                            <div className="carousel-bar-yes" style={{ width: `${yPct}%` }} />
                            <div className="carousel-bar-no" style={{ width: `${100 - yPct}%` }} />
                        </div>
                        <div className="carousel-bar-lbl">
                            <span style={{ color: 'var(--yes)' }}>YES {yPct}%</span>
                            <span style={{ color: 'var(--no)' }}>NO {100 - yPct}%</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Controls */}
            {markets.length > 1 && (
                <div className="carousel-controls">
                    <button onClick={goPrev} className="carousel-arrow">‹</button>
                    <div className="carousel-dots">
                        {markets.map((_, i) => (
                            <button key={i} className={`carousel-dot ${i === idx ? 'active' : ''}`} onClick={() => goTo(i)} />
                        ))}
                    </div>
                    <button onClick={goNext} className="carousel-arrow">›</button>
                </div>
            )}
        </div>
    );
};

export default TrendingCarousel;
