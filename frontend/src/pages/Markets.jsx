import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Markets.css';

const Markets = () => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('open');
    const [query, setQuery] = useState('');

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

        const channel = supabase
            .channel('markets-list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'markets' }, fetchMarkets)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [filter]);

    // Client-side search filter
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return markets;
        return markets.filter(m =>
            m.title?.toLowerCase().includes(q) ||
            m.category?.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q)
        );
    }, [markets, query]);

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const yesPercent = (m) => {
        const y = Number(m.total_yes ?? m.yes_pool ?? 0);
        const n = Number(m.total_no ?? m.no_pool ?? 0);
        const total = y + n;
        return total > 0 ? Math.round((y / total) * 100) : 50;
    };

    const statusColor = { open: '#16a34a', closed: '#f59e0b', resolved: '#6366f1', cancelled: '#ef4444' };

    return (
        <div className="markets-page">
            <div className="markets-header">
                <h1>Prediction Markets</h1>
                <p>Bet on real-world outcomes with virtual points</p>
            </div>

            {/* ── Search bar ── */}
            <div className="markets-search-wrap">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    className="markets-search"
                    placeholder="Search markets by title, category..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    aria-label="Search markets"
                />
                {query && (
                    <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">×</button>
                )}
            </div>

            {/* ── Status filter tabs ── */}
            <div className="filter-tabs">
                {['open', 'closed', 'resolved'].map(s => (
                    <button
                        key={s}
                        className={`filter-tab ${filter === s ? 'active' : ''}`}
                        onClick={() => { setFilter(s); setQuery(''); }}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── Results count ── */}
            {query && !loading && (
                <p className="search-result-count">
                    {filtered.length === 0
                        ? `No results for "${query}"`
                        : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`}
                </p>
            )}

            {loading ? (
                <div className="loading">Loading markets...</div>
            ) : filtered.length === 0 && !query ? (
                <div className="empty">No {filter} markets yet.</div>
            ) : filtered.length === 0 ? (
                <div className="empty">No markets match your search.</div>
            ) : (
                <div className="markets-grid">
                    {filtered.map(m => {
                        const yes = yesPercent(m);
                        return (
                            <Link to={`/markets/${m.id}`} key={m.id} className="market-card">
                                {/* Left: Image */}
                                <div className="card-image">
                                    {m.image_url ? (
                                        <img src={m.image_url} alt="" className="market-img" />
                                    ) : (
                                        <div className="market-img-fallback">
                                            {m.title?.[0]?.toUpperCase() ?? '?'}
                                        </div>
                                    )}
                                </div>

                                {/* Center: info */}
                                <div className="card-info">
                                    <div className="card-top">
                                        <span className="category-badge">{m.category}</span>
                                        <span className="status-dot" style={{ background: statusColor[m.status] }} />
                                    </div>
                                    <h3 className="card-title">
                                        {query ? <Highlight text={m.title} query={query} /> : m.title}
                                    </h3>
                                    <div className="card-bottom">
                                        <span>💰 {Number(m.total_pool ?? 0).toFixed(0)} pts</span>
                                        <span>📅 {formatDate(m.closing_date)}</span>
                                    </div>
                                    {m.status === 'resolved' && m.result && (
                                        <div className={`result-badge ${m.result}`}>
                                            Result: {m.result.toUpperCase()} ✓
                                        </div>
                                    )}
                                </div>

                                {/* Right: odds */}
                                <div className="card-odds">
                                    <div className="odds-pct">{yes}%</div>
                                    <div className="odds-lbl">YES chance</div>
                                    <div className="card-yn">
                                        <span className="btn-yes">Yes</span>
                                        <span className="btn-no">No</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/* Highlight matching text */
const Highlight = ({ text, query }) => {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    );
};

export default Markets;
