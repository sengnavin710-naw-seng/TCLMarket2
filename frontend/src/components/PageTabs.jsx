import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import './PageTabs.css';

const PageTabs = () => {
    const { pathname } = useLocation();
    const { t } = useLang();

    const TABS = [
        { path: '/', label: t.tabs.home },
        { path: '/leaderboard', label: t.tabs.leaderboard },
        { path: '/markets', label: t.tabs.markets },
    ];

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
