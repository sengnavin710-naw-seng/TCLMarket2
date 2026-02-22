import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, login } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await register(email, password, username);
            await login(email, password);
            toast.success('Account created! You got 1,000 pts 🎁');
            navigate('/markets');
        } catch (err) {
            toast.error(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">TCL</div>
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-sub">Join free and get 1,000 virtual points instantly!</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    {[
                        { label: 'Username', type: 'text', value: username, set: setUsername, ph: 'cooltrader99' },
                        { label: 'Email', type: 'email', value: email, set: setEmail, ph: 'you@example.com' },
                        { label: 'Password', type: 'password', value: password, set: setPassword, ph: '••••••••' },
                    ].map(({ label, type, value, set, ph }) => (
                        <div key={label} className="auth-field">
                            <label>{label}</label>
                            <input type={type} value={value} onChange={e => set(e.target.value)} required placeholder={ph} />
                        </div>
                    ))}
                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Creating account...' : 'Sign Up — Get 1,000 pts Free 🎁'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
};
export default Register;
