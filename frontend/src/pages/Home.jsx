import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ markets: 0, users: 0, volume: 0, resolved: 0 });
    const [featured, setFeatured] = useState([]);

    useEffect(() => {
        // Single combined fetch for performance
        const load = async () => {
            const [{ count: markets }, { count: users }, { data: vol }, { count: resolved }, { data: mkt }] = await Promise.all([
                supabase.from('markets').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('bets').select('stake'),
                supabase.from('markets').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
                supabase.from('markets').select('*').eq('status', 'open').order('total_pool', { ascending: false }).limit(3),
            ]);
            const volume = (vol || []).reduce((s, b) => s + Number(b.stake), 0);
            setStats({ markets: markets || 0, users: users || 0, volume, resolved: resolved || 0 });
            setFeatured(mkt || []);
        };
        load();
    }, []);

    const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const yesPercent = m => {
        const total = Number(m.yes_pool) + Number(m.no_pool);
        return total > 0 ? Math.round((Number(m.yes_pool) / total) * 100) : 50;
    };

    return (
        <div className="home">

            {/* ══ Hero ══ */}
            <section className="hero">
                <div className="hero-glow" />
                <div className="hero-content">
                    <span className="hero-badge">🎯 Virtual Prediction Markets</span>
                    <h1 className="hero-title">
                        Predict the Future,<br />
                        <span className="hero-gradient">Win Virtual Points</span>
                    </h1>
                    <p className="hero-sub">
                        Bet on real-world outcomes using virtual currency.<br />
                        No real money — just skill, strategy, and fun.
                    </p>
                    {!user && (
                        <div className="hero-cta">
                            <Link to="/register" className="btn-primary">Get 1,000 pts Free 🎁</Link>
                            <Link to="/login" className="btn-ghost">Login →</Link>
                        </div>
                    )}
                </div>
            </section>

            {/* ══ Stats ══ */}
            <section className="stats-section">
                <div className="stats-grid">
                    {[
                        { icon: '📊', value: stats.markets, label: 'Total Markets', color: '#818cf8' },
                        { icon: '👥', value: stats.users, label: 'Traders', color: '#34d399' },
                        { icon: '💰', value: `${stats.volume.toLocaleString()} pts`, label: 'Volume Traded', color: '#f59e0b' },
                        { icon: '✅', value: stats.resolved, label: 'Resolved', color: '#a78bfa' },
                    ].map(s => (
                        <div key={s.label} className="stat-card" style={{ '--c': s.color }}>
                            <div className="stat-icon">{s.icon}</div>
                            <div className="stat-val">{s.value}</div>
                            <div className="stat-lbl">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ Hot Markets ══ */}
            {featured.length > 0 && (
                <section className="markets-section">
                    <div className="sec-head">
                        <h2>🔥 Hot Markets</h2>
                        <Link to="/markets" className="link-all">View All →</Link>
                    </div>
                    <div className="mkt-grid">
                        {featured.map(m => {
                            const yes = yesPercent(m);
                            return (
                                <div key={m.id} className="mkt-card" onClick={() => navigate(`/markets/${m.id}`)}>
                                    <div className="mkt-top">
                                        <span className="mkt-cat">{m.category}</span>
                                        <span className="mkt-pool">💰 {Number(m.total_pool).toFixed(0)} pts</span>
                                    </div>
                                    <h3 className="mkt-title">{m.title}</h3>
                                    <div className="mkt-bar">
                                        <div className="mkt-bar-yes" style={{ width: `${yes}%` }} />
                                    </div>
                                    <div className="mkt-odds">
                                        <span style={{ color: '#10b981', fontWeight: 700 }}>YES {yes}%</span>
                                        <span style={{ color: '#ef4444', fontWeight: 700 }}>NO {100 - yes}%</span>
                                    </div>
                                    <div className="mkt-footer">
                                        <span>Closes {fmtDate(m.closing_date)}</span>
                                        <span className="mkt-cta">Bet Now →</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ══ How it Works ══ */}
            <section className="how-section">
                <h2>How It Works</h2>
                <div className="how-grid">
                    {[
                        { icon: '🎁', step: '1', title: 'Get 1,000 Points', desc: 'Sign up free and receive 1,000 virtual points instantly.' },
                        { icon: '📊', step: '2', title: 'Pick a Market', desc: 'Browse markets on crypto, sports, politics & more.' },
                        { icon: '🎯', step: '3', title: 'Place Your Bet', desc: 'Stake on YES or NO. Odds shift with the crowd.' },
                        { icon: '🏆', step: '4', title: 'Collect Winnings', desc: 'Win? Get your payout automatically when market resolves.' },
                    ].map(h => (
                        <div key={h.step} className="how-card">
                            <div className="how-num">{h.step}</div>
                            <div className="how-icon">{h.icon}</div>
                            <h3>{h.title}</h3>
                            <p>{h.desc}</p>
                        </div>
                    ))}
                </div>
                {!user && (
                    <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                        <Link to="/register" className="btn-primary btn-lg">Create Free Account →</Link>
                    </div>
                )}
            </section>

        </div>
    );
};

export default Home;
