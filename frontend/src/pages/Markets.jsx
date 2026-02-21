import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Markets.css';

const statusColor = { open: '#10b981', closed: '#f59e0b', resolved: '#6366f1', cancelled: '#ef4444' };

const OddsBar = ({ totalYes, totalNo, totalPool }) => {
    const yesOdds = totalPool > 0 ? ((totalYes / totalPool) * 100).toFixed(1) : 50;
    const noOdds = totalPool > 0 ? ((totalNo / totalPool) * 100).toFixed(1) : 50;
    return (
        <div className="odds-bar-wrap">
            <div className="odds-bar">
                <div className="odds-yes" style={{ width: `${yesOdds}%` }} />
                <div className="odds-no" style={{ width: `${noOdds}%` }} />
            </div>
            <div className="odds-labels">
                <span className="yes-label">YES {yesOdds}%</span>
                <span className="no-label">NO {noOdds}%</span>
            </div>
        </div>
    );
};

const Markets = () => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('open');

    useEffect(() => {
        const fetchMarkets = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('markets')
                .select('*')
                .eq('status', filter)
                .order('created_at', { ascending: false });
            setMarkets(data || []);
            setLoading(false);
        };
        fetchMarkets();

        // Realtime subscription
        const channel = supabase
            .channel('markets-list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'markets' }, fetchMarkets)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [filter]);

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="markets-page">
            <div className="markets-header">
                <h1>Prediction Markets</h1>
                <p>Bet on real-world outcomes with virtual points</p>
            </div>

            <div className="filter-tabs">
                {['open', 'closed', 'resolved'].map(s => (
                    <button key={s} className={`filter-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading">Loading markets...</div>
            ) : markets.length === 0 ? (
                <div className="empty">No {filter} markets yet.</div>
            ) : (
                <div className="markets-grid">
                    {markets.map(m => (
                        <Link to={`/markets/${m.id}`} key={m.id} className="market-card">
                            <div className="card-top">
                                <span className="category-badge">{m.category}</span>
                                <span className="status-dot" style={{ background: statusColor[m.status] }} />
                            </div>
                            <h3 className="card-title">{m.title}</h3>
                            <OddsBar totalYes={m.total_yes} totalNo={m.total_no} totalPool={m.total_pool} />
                            <div className="card-bottom">
                                <span>💰 {Number(m.total_pool).toFixed(0)} pts pool</span>
                                <span>📅 {formatDate(m.closing_date)}</span>
                            </div>
                            {m.status === 'resolved' && m.result && (
                                <div className={`result-badge ${m.result}`}>
                                    Result: {m.result.toUpperCase()} ✓
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Markets;
