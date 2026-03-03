import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        setProfile(data);
    };

    useEffect(() => {
        let profileChannel = null;

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                // Realtime: อัปเดต balance ทันทีเมื่อ admin จ่าย payout
                profileChannel = supabase
                    .channel(`user-profile-${session.user.id}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users',
                        filter: `id=eq.${session.user.id}`
                    }, (payload) => setProfile(payload.new))
                    .subscribe();
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
                if (profileChannel) supabase.removeChannel(profileChannel);
                profileChannel = supabase
                    .channel(`user-profile-${session.user.id}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users',
                        filter: `id=eq.${session.user.id}`
                    }, (payload) => setProfile(payload.new))
                    .subscribe();
            } else {
                setProfile(null);
                if (profileChannel) supabase.removeChannel(profileChannel);
            }
        });

        return () => {
            subscription.unsubscribe();
            if (profileChannel) supabase.removeChannel(profileChannel);
        };
    }, []);

    const register = async (email, password, username) => {
        // Pass username as metadata — DB trigger will auto-create public.users profile
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });
        if (signUpError) throw signUpError;
        return authData;
    };

    const refreshProfile = async () => {
        if (!user) return;
        await fetchProfile(user.id);
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await fetchProfile(data.user.id);
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, register, login, logout, refreshProfile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
