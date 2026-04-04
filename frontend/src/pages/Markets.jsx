import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import MarketCard from '../components/MarketCard';
import TradeModal from '../components/TradeModal';
import './Markets.css';

const STATUSES = ['open', 'closed', 'resolved'];

const Markets = ({ searchQuery = '', categoryFilter = 'All' }) => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('open');
    const [tradeTarget, setTradeTarget] = useState(null); // { market, side }

    const fetchMarkets = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase
            .from('markets')
            .select('*')
            .eq('status', filter)
            .order('total_pool', { ascending: false });
        setMarkets(data || []);
        setLoading(false);
    }, [filter]);

    useEffect(() => {
        fetchMarkets();
        const ch = supabase
            .channel('markets-list-v2')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'markets' }, fetchMarkets)
            .subscribe();
        return () => supabase.removeChannel(ch);
    }, [fetchMarkets]);

    const filtered = useMemo(() => {
        let arr = markets;
        if (categoryFilter && categoryFilter !== 'All') {
            arr = arr.filter(m => m.category?.toLowerCase() === categoryFilter.toLowerCase());
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            arr = arr.filter(m =>
                m.title?.toLowerCase().includes(q) ||
                m.category?.toLowerCase().includes(q) ||
                m.description?.toLowerCase().includes(q)
            );
        }
        return arr;
    }, [markets, searchQuery, categoryFilter]);

    const openTrade = (market, side) => setTradeTarget({ market, side });
    const closeTrade = () => setTradeTarget(null);

    return (
        <div className="markets-page">
            {/* Status tabs */}
            <div className="status-tabs">
                {STATUSES.map(s => (
                    <button
                        key={s}
                        className={`status-tab ${filter === s ? 'active' : ''}`}
                        onClick={() => setFilter(s)}
                    >
                        {s === 'open' && <span className="tab-live-dot" />}
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        {!loading && filter === s && (
                            <span className="tab-count">{filtered.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="markets-loader">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="card-skeleton" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="markets-empty">
                    <span>🔍</span>
                    <p>{searchQuery ? `No results for "${searchQuery}"` : `No ${filter} markets`}</p>
                </div>
            ) : (
                <div className="markets-grid">
                    {filtered.map(m => (
                        <MarketCard key={m.id} market={m} onBet={openTrade} />
                    ))}
                </div>
            )}

            {/* Trade Modal */}
            {tradeTarget && (
                <TradeModal
                    market={tradeTarget.market}
                    initialSide={tradeTarget.side}
                    onClose={closeTrade}
                    onSuccess={fetchMarkets}
                />
            )}
        </div>
    );
};

export default Markets;
