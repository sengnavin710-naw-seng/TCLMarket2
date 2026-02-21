import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import './Leaderboard.css';

const Leaderboard = () => {
    const { user } = useAuth();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myRank, setMyRank] = useState(null);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        setLoading(true);

        // Fetch all users sorted by balance
        const { data: users } = await supabase
            .from('users')
            .select('id, username, balance, role, created_at')
            .order('balance', { ascending: false });

        if (!users) { setLoading(false); return; }

        // Fetch bet stats for each user
        const enriched = await Promise.all(users.map(async (u, idx) => {
            const { data: bets } = await supabase
                .from('bets')
                .select('status, stake, actual_payout')
                .eq('user_id', u.id);

            const total = bets?.length || 0;
            const won = bets?.filter(b => b.status === 'won').length || 0;
            const lost = bets?.filter(b => b.status === 'lost').length || 0;
            const totalWon = bets?.filter(b => b.status === 'won').reduce((s, b) => s + Number(b.actual_payout), 0) || 0;
            const totalStaked = bets?.reduce((s, b) => s + Number(b.stake), 0) || 0;
            const pnl = totalWon - totalStaked;
            const winRate = total > 0 ? Math.round((won / (won + lost || 1)) * 100) : 0;

            return { ...u, rank: idx + 1, total, won, lost, winRate, pnl };
        }));

        setPlayers(enriched);
        if (user) {
            const myPos = enriched.findIndex(p => p.id === user.id);
            setMyRank(myPos >= 0 ? myPos + 1 : null);
        }
        setLoading(false);
    };

    const medal = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const pnlColor = (pnl) => pnl >= 0 ? '#10b981' : '#ef4444';

    return (
        <div className="lb-page">
            <div className="lb-header">
                <h1>🏆 Leaderboard</h1>
                <p>Top traders ranked by virtual balance</p>
                {myRank && (
                    <div className="my-rank-badge">Your Rank: <strong>#{myRank}</strong></div>
                )}
            </div>

            {loading ? (
                <div className="lb-loading">Loading rankings...</div>
            ) : (
                <>
                    {/* ── Top 3 Podium ── */}
                    {players.length >= 3 && (
                        <div className="podium">
                            {/* 2nd */}
                            <div className="podium-slot silver">
                                <div className="podium-avatar">{players[1].username[0].toUpperCase()}</div>
                                <div className="podium-name">{players[1].username}</div>
                                <div className="podium-balance">{Number(players[1].balance).toLocaleString()} pts</div>
                                <div className="podium-base podium-base-2">🥈 2nd</div>
                            </div>
                            {/* 1st */}
                            <div className="podium-slot gold">
                                <div className="podium-crown">👑</div>
                                <div className="podium-avatar">{players[0].username[0].toUpperCase()}</div>
                                <div className="podium-name">{players[0].username}</div>
                                <div className="podium-balance">{Number(players[0].balance).toLocaleString()} pts</div>
                                <div className="podium-base podium-base-1">🥇 1st</div>
                            </div>
                            {/* 3rd */}
                            {players[2] && (
                                <div className="podium-slot bronze">
                                    <div className="podium-avatar">{players[2].username[0].toUpperCase()}</div>
                                    <div className="podium-name">{players[2].username}</div>
                                    <div className="podium-balance">{Number(players[2].balance).toLocaleString()} pts</div>
                                    <div className="podium-base podium-base-3">🥉 3rd</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Full Table ── */}
                    <div className="lb-table-wrap">
                        <table className="lb-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Trader</th>
                                    <th>Balance</th>
                                    <th>Bets</th>
                                    <th>Won</th>
                                    <th>Win Rate</th>
                                    <th>P&amp;L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {players.map(p => (
                                    <tr key={p.id} className={user && p.id === user.id ? 'lb-me' : ''}>
                                        <td className="lb-rank">{medal(p.rank)}</td>
                                        <td className="lb-user">
                                            <div className="lb-avatar">{p.username[0].toUpperCase()}</div>
                                            <div>
                                                <div className="lb-username">
                                                    {p.username}
                                                    {user && p.id === user.id && <span className="lb-you">You</span>}
                                                </div>
                                                {p.role === 'admin' && <span className="lb-admin-tag">Admin</span>}
                                            </div>
                                        </td>
                                        <td className="lb-balance">💰 {Number(p.balance).toLocaleString()} pts</td>
                                        <td className="lb-num">{p.total}</td>
                                        <td className="lb-num">{p.won}</td>
                                        <td>
                                            <span className="lb-winrate" style={{ color: p.winRate >= 50 ? '#10b981' : '#f59e0b' }}>
                                                {p.winRate}%
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: pnlColor(p.pnl), fontWeight: 700 }}>
                                                {p.pnl >= 0 ? '+' : ''}{Math.round(p.pnl)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Leaderboard;
