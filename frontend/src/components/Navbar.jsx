import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import './Navbar.css';

const TAB_PATHS = ['/', '/leaderboard', '/markets'];
const LANGS = [
    { code: 'en', flag: '🇬🇧', label: 'EN' },
    { code: 'th', flag: '🇹🇭', label: 'TH' },
    { code: 'my', flag: '🇲🇲', label: 'MM' },
];

const Navbar = () => {
    const { user, profile } = useAuth();
    const { lang, switchLang, t } = useLang();
    const navigate = useNavigate();
    const location = useLocation();
    const showBack = !TAB_PATHS.includes(location.pathname);

    const initials = profile?.username ? profile.username[0].toUpperCase() : '?';
    const nextLang = () => {
        const idx = LANGS.findIndex(l => l.code === lang);
        switchLang(LANGS[(idx + 1) % LANGS.length].code);
    };
    const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];

    return (
        <nav className="navbar">
            {/* Back button OR Brand */}
            {showBack ? (
                <button className="navbar-back" onClick={() => navigate(-1)} aria-label="Go back">
                    {t.nav.back}
                </button>
            ) : null}
            <Link to="/" className="navbar-brand">TCL</Link>

            {/* Right side */}
            <div className="navbar-right">
                {/* Language switcher */}
                <button className="lang-btn" onClick={nextLang} title="Switch language" aria-label="Switch language">
                    <span className="lang-flag">{currentLang.flag}</span>
                    <span className="lang-code">{currentLang.label}</span>
                </button>

                {user ? (
                    <>
                        <div className="balance-chip">
                            <span className="balance-icon">💰</span>
                            <span className="balance-amt">{Number(profile?.balance ?? 0).toFixed(0)}</span>
                            <span className="balance-unit">{t.nav.pts}</span>
                        </div>

                        {profile?.role === 'admin' && (
                            <Link to="/admin" className="admin-pill">{t.nav.admin}</Link>
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
                        <Link to="/login" className="btn-login">{t.nav.login}</Link>
                        <Link to="/register" className="btn-register">{t.nav.signup}</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
