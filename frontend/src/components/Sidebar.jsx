import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Sidebar.css';

const Sidebar = () => {
    const [hot, setHot] = useState([]);
    const [breaking, setBreaking] = useState([]);

    useEffect(() => {
        // Hot markets by pool size
        supabase
            .from('markets')
            .select('id, title, total_yes, total_no, total_pool, category')
            .eq('status', 'open')
            .order('total_pool', { ascending: false })
            .limit(6)
            .then(({ data }) => setHot(data || []));

        // Recently resolved
        supabase
            .from('markets')
            .select('id, title, result, status')
            .eq('status', 'resolved')
            .order('created_at', { ascending: false })
            .limit(4)
            .then(({ data }) => setBreaking(data || []));
    }, []);

    const yPct = (m) => {
        const y = Number(m.total_yes ?? 0), n = Number(m.total_no ?? 0);
        const t = y + n;
        return t > 0 ? Math.round((y / t) * 100) : 50;
    };

    return (
        <aside className="sidebar">
            {/* Hot Topics */}
            <div className="sidebar-section">
                <div className="sidebar-header">
                    <span className="sidebar-icon">🔥</span>
                    <span>Hot Markets</span>
                </div>
                <div className="sidebar-list">
                    {hot.map(m => {
                        const pct = yPct(m);
                        const isUp = pct >= 50;
                        return (
                            <Link to={`/markets/${m.id}`} key={m.id} className="sidebar-item">
                                <div className="sidebar-item-info">
                                    <span className="sidebar-item-title">{m.title}</span>
                                    <span className="sidebar-item-vol">
                                        💰 {Number(m.total_pool ?? 0).toLocaleString()} pts
                                    </span>
                                </div>
                                <div className="sidebar-item-pct" style={{ color: isUp ? 'var(--yes)' : 'var(--no)' }}>
                                    <span className="pct-arrow">{isUp ? '▲' : '▼'}</span>
                                    {pct}%
                                </div>
                            </Link>
                        );
                    })}
                    {hot.length === 0 && <p className="sidebar-empty">No open markets</p>}
                </div>
            </div>

            {/* Breaking — recently resolved */}
            {breaking.length > 0 && (
                <div className="sidebar-section">
                    <div className="sidebar-header">
                        <span className="sidebar-icon">📢</span>
                        <span>Just Resolved</span>
                    </div>
                    <div className="sidebar-list">
                        {breaking.map(m => (
                            <Link to={`/markets/${m.id}`} key={m.id} className="sidebar-item">
                                <span className="sidebar-item-title">{m.title}</span>
                                <span className={`sidebar-result ${m.result}`}>
                                    {m.result?.toUpperCase()} ✓
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
