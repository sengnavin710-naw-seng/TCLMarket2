import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import './Navbar.css';

const CATEGORIES = ['All', 'Politics', 'Sports', 'Crypto', 'General'];
const LANGS = [
    { code: 'en', flag: '🇬🇧', label: 'EN' },
    { code: 'th', flag: '🇹🇭', label: 'TH' },
    { code: 'my', flag: '🇲🇲', label: 'MM' },
];

const TAB_PATHS = ['/', '/leaderboard', '/markets'];

const Navbar = ({ onSearch, onCategory, activeCategory }) => {
    const { user, profile } = useAuth();
    const { lang, switchLang, t } = useLang();
    const navigate = useNavigate();
    const location = useLocation();
    const showBack = !TAB_PATHS.includes(location.pathname);

    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const searchRef = useRef(null);

    const initials = profile?.username ? profile.username[0].toUpperCase() : '?';
    const nextLang = () => {
        const idx = LANGS.findIndex(l => l.code === lang);
        switchLang(LANGS[(idx + 1) % LANGS.length].code);
    };
    const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];
    const showCategories = TAB_PATHS.includes(location.pathname);

    const handleSearch = (e) => {
        const val = e.target.value;
        setQuery(val);
        onSearch?.(val);
    };

    const openSearch = () => {
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 50);
    };

    useEffect(() => {
        if (!searchOpen) { setQuery(''); onSearch?.(''); }
    }, [searchOpen]);

    return (
        <header className="navbar-wrapper">
            <nav className="navbar">
                {/* Left */}
                <div className="navbar-left">
                    {showBack ? (
                        <button className="navbar-back" onClick={() => navigate(-1)} aria-label="Go back">
                            ← {t.nav?.back || 'Back'}
                        </button>
                    ) : null}
                    <Link to="/" className="navbar-brand">
                        <span className="brand-dot" />
                        TCL<span className="brand-accent">Market</span>
                    </Link>
                </div>

                {/* Center — Search */}
                <div className={`navbar-search-wrap ${searchOpen ? 'open' : ''}`}>
                    <span className="search-ico">⌕</span>
                    <input
                        ref={searchRef}
                        type="text"
                        className="navbar-search"
                        placeholder="Search markets..."
                        value={query}
                        onChange={handleSearch}
                        onBlur={() => !query && setSearchOpen(false)}
                        id="navbar-search-input"
                    />
                    {query && (
                        <button className="search-x" onClick={() => { setQuery(''); onSearch?.(''); }}>✕</button>
                    )}
                </div>

                {/* Right */}
                <div className="navbar-right">
                    <button className="search-toggle-btn" onClick={openSearch} aria-label="Search">
                        <span>⌕</span>
                    </button>

                    <button className="lang-btn" onClick={nextLang} title="Switch language" aria-label="Switch language">
                        <span>{currentLang.flag}</span>
                        <span className="lang-code">{currentLang.label}</span>
                    </button>

                    {user ? (
                        <>
                            <div className="balance-chip">
                                <span className="balance-icon">💰</span>
                                <span className="balance-amt">{Number(profile?.balance ?? 0).toLocaleString()}</span>
                            </div>

                            {profile?.role === 'admin' && (
                                <Link to="/admin" className="admin-pill">{t.nav?.admin || 'Admin'}</Link>
                            )}

                            <Link to="/profile" className="avatar-link" title="My Profile">
                                <div className="navbar-avatar">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="navbar-avatar-img" />
                                    ) : (
                                        <span className="avatar-initials">{initials}</span>
                                    )}
                                </div>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn-login">{t.nav?.login || 'Login'}</Link>
                            <Link to="/register" className="btn-register">{t.nav?.signup || 'Sign up'}</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Category tabs */}
            {showCategories && (
                <div className="category-bar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`cat-tab ${(activeCategory || 'All') === cat ? 'active' : ''}`}
                            onClick={() => onCategory?.(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}
        </header>
    );
};

export default Navbar;
