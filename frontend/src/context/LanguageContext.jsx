import { createContext, useContext, useState } from 'react';
import translations from '../lib/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => localStorage.getItem('tcl_lang') || 'en');

    const switchLang = (l) => {
        setLang(l);
        localStorage.setItem('tcl_lang', l);
    };

    const t = translations[lang] || translations['en'];

    return (
        <LanguageContext.Provider value={{ lang, switchLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLang = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLang must be used within LanguageProvider');
    return ctx;
};
