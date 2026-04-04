import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Markets from './pages/Markets';
import MarketDetail from './pages/MarketDetail';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Leaderboard from './pages/Leaderboard';
import './App.css';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '2rem' }}>⏳</div>;
    return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user, profile, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '2rem' }}>⏳</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (profile?.role !== 'admin') return <Navigate to="/" replace />;
    return children;
};

const TAB_PATHS = ['/', '/leaderboard', '/markets'];

const AppRoutes = () => {
    const { pathname } = useLocation();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const showTabs = TAB_PATHS.includes(pathname);

    return (
        <>
            <Navbar
                onSearch={setSearch}
                onCategory={setCategory}
                activeCategory={category}
            />
            <main className="app-main">
                <div className="app-container">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/markets"
                            element={<Markets searchQuery={search} categoryFilter={category} />}
                        />
                        <Route path="/markets/:id" element={<MarketDetail />} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    </Routes>
                </div>
            </main>
        </>
    );
};

function App() {
    return (
        <BrowserRouter>
            <LanguageProvider>
                <AuthProvider>
                    <ToastProvider>
                        <AppRoutes />
                    </ToastProvider>
                </AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
}

export default App;
