import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './locales/en.json';
import ar from './locales/ar.json';

const translations = { en, ar };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (let i = 0; i < keys.length; i++) {
      if (value && typeof value === 'object') {
        value = value[keys[i]];
      } else {
        value = undefined;
      }
    }
    if (value === undefined) {
      // fallback to en
      let fallback = translations.en;
      for (let i = 0; i < keys.length; i++) {
        if (fallback && typeof fallback === 'object') {
          fallback = fallback[keys[i]];
        } else {
          fallback = undefined;
        }
      }
      return fallback || key;
    }
    return value;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
