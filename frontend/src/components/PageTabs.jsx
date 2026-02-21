import { Link, useLocation } from 'react-router-dom';
import './PageTabs.css';

const TABS = [
    { path: '/', label: '🏠 Home' },
    { path: '/leaderboard', label: '🏆 Leaderboard' },
    { path: '/markets', label: '📊 Markets' },
];

const PageTabs = () => {
    const { pathname } = useLocation();

    return (
        <div className="page-tabs-wrap">
            <div className="page-tabs">
                {TABS.map(tab => (
                    <Link
                        key={tab.path}
                        to={tab.path}
                        className={`page-tab ${pathname === tab.path ? 'page-tab-active' : ''}`}
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default PageTabs;
