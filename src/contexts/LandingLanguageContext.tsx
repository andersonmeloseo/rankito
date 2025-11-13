import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LandingLocale } from '@/i18n/landingTranslations';

const LOCALE_STORAGE_KEY = 'rankito-landing-locale';

interface LandingLanguageContextType {
  locale: LandingLocale;
  setLocale: (locale: LandingLocale) => void;
  isTransitioning: boolean;
}

const LandingLanguageContext = createContext<LandingLanguageContextType | undefined>(undefined);

export function LandingLanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LandingLocale>(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return (stored as LandingLocale) || 'pt-BR';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = (newLocale: LandingLocale) => {
    if (newLocale === locale) return;
    
    setIsTransitioning(true);
    
    // Fade out duration: 200ms
    setTimeout(() => {
      setLocaleState(newLocale);
      setIsTransitioning(false);
    }, 200);
  };

  return (
    <LandingLanguageContext.Provider value={{ locale, setLocale, isTransitioning }}>
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
