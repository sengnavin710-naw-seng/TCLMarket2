import { createContext, useCallback, useContext, useRef, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);

let _id = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {
        // Start exit animation
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        // Remove after animation
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 350);
        clearTimeout(timers.current[id]);
    }, []);

    const show = useCallback(({ type = 'info', message, duration = 3500 }) => {
        const id = ++_id;
        setToasts(prev => [...prev, { id, type, message, exiting: false }]);
        timers.current[id] = setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    // Shorthand helpers
    const toast = {
        success: (msg, dur) => show({ type: 'success', message: msg, duration: dur }),
        error: (msg, dur) => show({ type: 'error', message: msg, duration: dur ?? 5000 }),
        info: (msg, dur) => show({ type: 'info', message: msg, duration: dur }),
        warn: (msg, dur) => show({ type: 'warn', message: msg, duration: dur }),
        dismiss,
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} dismiss={dismiss} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

/* ── Internal container ── */
const ICONS = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' };

const ToastContainer = ({ toasts, dismiss }) => (
    <div className="toast-container" aria-live="polite">
        {toasts.map(t => (
            <div
                key={t.id}
                className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : 'toast-enter'}`}
                role="alert"
            >
                <span className="toast-icon">{ICONS[t.type]}</span>
                <span className="toast-msg">{t.message}</span>
                <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="close">×</button>
            </div>
        ))}
    </div>
);
