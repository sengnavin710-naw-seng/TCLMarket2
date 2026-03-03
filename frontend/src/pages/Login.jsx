import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLang } from '../context/LanguageContext';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { t } = useLang();
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back! 👋');
            navigate('/markets');
        } catch (err) {
            toast.error(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">TCL</div>
                <h2 className="auth-title">{t.login.title}</h2>
                <p className="auth-sub">{t.login.subtitle}</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label>{t.login.email}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                    </div>
                    <div className="auth-field">
                        <label>{t.login.password}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                    </div>
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? t.login.loading : t.login.btn}
                    </button>
                </form>

                <p className="auth-footer">
                    {t.login.footer} <Link to="/register">{t.login.signup_link}</Link>
                </p>
            </div>
        </div>
    );
};
export default Login;
