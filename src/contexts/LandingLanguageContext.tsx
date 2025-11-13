import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LandingLocale } from '@/i18n/landingTranslations';

const LOCALE_STORAGE_KEY = 'rankito-landing-locale';

interface LandingLanguageContextType {
  locale: LandingLocale;
  setLocale: (locale: LandingLocale) => void;
}

const LandingLanguageContext = createContext<LandingLanguageContextType | undefined>(undefined);

export function LandingLanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<LandingLocale>(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return (stored as LandingLocale) || 'pt-BR';
  });

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  return (
    <LandingLanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LandingLanguageContext.Provider>
  );
}

export function useLandingLanguageContext() {
  const context = useContext(LandingLanguageContext);
  if (context === undefined) {
    throw new Error('useLandingLanguageContext must be used within LandingLanguageProvider');
  }
  return context;
}
