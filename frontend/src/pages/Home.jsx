import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import TrendingCarousel from '../components/TrendingCarousel';
import Sidebar from '../components/Sidebar';
import MarketCard from '../components/MarketCard';
import TradeModal from '../components/TradeModal';
import './Home.css';

const Home = () => {
    const { user } = useAuth();
    const { t } = useLang();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ markets: 0, users: 0, volume: 0, resolved: 0 });
    const [recent, setRecent] = useState([]);
    const [tradeTarget, setTradeTarget] = useState(null);

    useEffect(() => {
        const load = async () => {
            const [{ count: markets }, { count: users }, { data: vol }, { count: resolved }, { data: mkt }] = await Promise.all([
                supabase.from('markets').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('bets').select('stake'),
                supabase.from('markets').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
                supabase.from('markets').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(6),
            ]);
            const volume = (vol || []).reduce((s, b) => s + Number(b.stake), 0);
            setStats({ markets: markets || 0, users: users || 0, volume, resolved: resolved || 0 });
            setRecent(mkt || []);
        };
        load();
    }, []);

    const openTrade = (market, side) => setTradeTarget({ market, side });

    return (
        <div className="home">
            {/* Hero — only for non-logged users */}
            {!user && (
                <section className="home-hero">
                    <span className="home-badge">🚀 Prediction Market</span>
                    <h1 className="home-title">
                        {t.home?.title1 || 'Predict'} <br />
                        <span className="home-gradient">{t.home?.title2 || 'Real Outcomes'}</span>
                    </h1>
                    <p className="home-sub">{t.home?.sub || 'Trade on what you believe. Earn when you\'re right.'}</p>
                    <div className="home-cta">
                        <Link to="/register" className="btn-primary">{t.home?.cta_register || 'Start Predicting'}</Link>
                        <Link to="/markets" className="btn-ghost">{t.home?.view_all || 'Browse Markets'}</Link>
                    </div>
                </section>
            )}

            {/* Stats */}
            <div className="home-stats">
                {[
                    { icon: '📊', value: stats.markets, label: 'Markets' },
                    { icon: '👥', value: stats.users, label: 'Traders' },
                    { icon: '💰', value: `${(stats.volume/1000).toFixed(1)}k`, label: 'Pts Volume' },
                    { icon: '✅', value: stats.resolved, label: 'Resolved' },
                ].map(s => (
                    <div key={s.label} className="home-stat">
                        <span className="stat-num">{s.value}</span>
                        <span className="stat-lbl">{s.icon} {s.label}</span>
                    </div>
                ))}
            </div>

            {/* Main grid: Carousel + Sidebar */}
            <div className="home-main-grid">
                <div className="home-content">
                    <TrendingCarousel />

                    {/* Recent markets */}
                    {recent.length > 0 && (
                        <section>
                            <div className="home-sec-head">
                                <h2 className="home-sec-title">Latest Markets</h2>
                                <Link to="/markets" className="home-sec-link">View all →</Link>
                            </div>
                            <div className="home-cards-grid">
                                {recent.map(m => (
                                    <MarketCard key={m.id} market={m} onBet={openTrade} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <Sidebar />
            </div>

            {/* Trade Modal */}
            {tradeTarget && (
                <TradeModal
                    market={tradeTarget.market}
                    initialSide={tradeTarget.side}
                    onClose={() => setTradeTarget(null)}
                />
            )}
        </div>
    );
};

export default Home;
