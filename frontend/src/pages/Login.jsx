import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/markets');
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 1rem' }}>
            <div style={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ color: '#fff', marginBottom: '1.5rem', textAlign: 'center' }}>Login to TCLMarket</h2>
                {error && <div style={{ background: '#f87171', color: '#fff', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ color: '#a0a0c0', display: 'block', marginBottom: '0.4rem' }}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                            style={{ width: '100%', padding: '0.75rem', background: '#0f0f1a', border: '1px solid #3a3a5a', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ color: '#a0a0c0', display: 'block', marginBottom: '0.4rem' }}>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                            style={{ width: '100%', padding: '0.75rem', background: '#0f0f1a', border: '1px solid #3a3a5a', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }} />
                    </div>
                    <button type="submit" disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p style={{ color: '#a0a0c0', textAlign: 'center', marginTop: '1rem' }}>
                    Don&apos;t have an account? <Link to="/register" style={{ color: '#7c3aed' }}>Sign Up</Link>
                </p>
            </div>
        </div>
    );
};
export default Login;
