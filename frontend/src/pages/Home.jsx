import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import './Home.css';

const Home = () => {
    const { user } = useAuth();
    const { t } = useLang();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ markets: 0, users: 0, volume: 0, resolved: 0 });
    const [featured, setFeatured] = useState([]);

    useEffect(() => {
        const load = async () => {
            const [{ count: markets }, { count: users }, { data: vol }, { count: resolved }, { data: mkt }] = await Promise.all([
                supabase.from('markets').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('bets').select('stake'),
                supabase.from('markets').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
                supabase.from('markets').select('*').eq('status', 'open').order('total_pool', { ascending: false }).limit(5),
            ]);
            const volume = (vol || []).reduce((s, b) => s + Number(b.stake), 0);
            setStats({ markets: markets || 0, users: users || 0, volume, resolved: resolved || 0 });
            setFeatured(mkt || []);
        };
        load();
    }, []);

    const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const yesPercent = m => {
        const total = Number(m.total_yes ?? m.yes_pool ?? 0) + Number(m.total_no ?? m.no_pool ?? 0);
        return total > 0 ? Math.round((Number(m.total_yes ?? m.yes_pool ?? 0) / total) * 100) : 50;
    };

    return (
        <div className="home">

            {/* ══ Hero ══ */}
            <section className="hero">
                <span className="hero-badge">{t.home.badge}</span>
                <h1 className="hero-title">
                    {t.home.title1}<br />
                    <span className="hero-gradient">{t.home.title2}</span>
                </h1>
                <p className="hero-sub">{t.home.sub.split('\n').map((line, i) => (
                    <span key={i}>{line}{i === 0 && <br />}</span>
                ))}</p>
                {!user && (
                    <div className="hero-cta">
                        <Link to="/register" className="btn-primary">{t.home.cta_register}</Link>
                        <Link to="/login" className="btn-ghost">{t.home.cta_login}</Link>
                    </div>
                )}
            </section>

            {/* ══ Stats ══ */}
            <section className="stats-section">
                <div className="stats-grid">
                    {[
                        { icon: '📊', value: stats.markets, label: t.home.stat_markets },
                        { icon: '👥', value: stats.users, label: t.home.stat_traders },
                        { icon: '💰', value: `${stats.volume.toLocaleString()} pts`, label: t.home.stat_volume },
                        { icon: '✅', value: stats.resolved, label: t.home.stat_resolved },
                    ].map(s => (
                        <div key={s.label} className="stat-card">
                            <div className="stat-icon">{s.icon}</div>
                            <div className="stat-info">
                                <div className="stat-val">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ Hot Markets ══ */}
            {featured.length > 0 && (
                <section>
                    <div className="sec-head">
                        <h2>{t.home.hot_markets}</h2>
                        <Link to="/markets" className="sec-link">{t.home.view_all}</Link>
                    </div>
                    <div className="mkt-list">
                        {featured.map(m => {
                            const yes = yesPercent(m);
                            return (
                                <Link to={`/markets/${m.id}`} key={m.id} className="mkt-row">
                                    <div className="mkt-row-info">
                                        <div className="mkt-row-cat">{m.category}</div>
                                        <div className="mkt-row-title">{m.title}</div>
                                        <div className="mkt-row-meta">
                                            <span>💰 {Number(m.total_pool ?? 0).toFixed(0)} pts pool</span>
                                            <span>📅 {fmtDate(m.closing_date)}</span>
                                        </div>
                                    </div>
                                    <div className="mkt-row-odds">
                                        <div className="odds-pct">{yes}%</div>
                                        <div className="odds-lbl">{t.home.yes_chance}</div>
                                        <div className="odds-bar-mini">
                                            <div className="odds-bar-fill" style={{ width: `${yes}%` }} />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ══ How it Works ══ */}
            <section className="how-section">
                <div className="sec-head">
                    <h2>{t.home.how_title}</h2>
                </div>
                <div className="how-grid">
                    {[
                        { icon: '🎁', title: t.home.how1_title, desc: t.home.how1_desc },
                        { icon: '📊', title: t.home.how2_title, desc: t.home.how2_desc },
                        { icon: '🎯', title: t.home.how3_title, desc: t.home.how3_desc },
                        { icon: '🏆', title: t.home.how4_title, desc: t.home.how4_desc },
                    ].map(h => (
                        <div key={h.title} className="how-card">
                            <div className="how-icon">{h.icon}</div>
                            <h3>{h.title}</h3>
                            <p>{h.desc}</p>
                        </div>
                    ))}
                </div>
                {!user && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <Link to="/register" className="btn-primary">{t.home.create_account}</Link>
                    </div>
                )}
            </section>

        </div>
    );
};

export default Home;
