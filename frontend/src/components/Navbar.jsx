import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, profile, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const initials = profile?.username ? profile.username[0].toUpperCase() : '?';

    return (
        <nav className="navbar">
            {/* Brand */}
            <Link to="/" className="navbar-brand">TCL</Link>

            {/* Right side */}
            <div className="navbar-right">
                {user ? (
                    <>
                        <div className="balance-chip">
                            <span className="balance-icon">💰</span>
                            <span className="balance-amt">{Number(profile?.balance ?? 0).toFixed(0)}</span>
                            <span className="balance-unit">pts</span>
                        </div>

                        {/* Admin first, then Avatar */}
                        {profile?.role === 'admin' && (
                            <Link to="/admin" className="admin-pill">Admin</Link>
                        )}

                        <Link to="/profile" className="avatar-link" title="My Profile">
                            <span className="avatar-initials">{initials}</span>
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="btn-login">Login</Link>
                        <Link to="/register" className="btn-register">Sign Up</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
