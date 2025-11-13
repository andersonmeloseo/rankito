import { landingTranslations, LandingLocale } from '@/i18n/landingTranslations';
import { useLandingLanguageContext } from '@/contexts/LandingLanguageContext';

export function useLandingTranslation() {
  const { locale, setLocale, isTransitioning } = useLandingLanguageContext();
  const t = landingTranslations[locale];

  const formatCurrency = (price: number) => {
    const currencyMap: Record<LandingLocale, { currency: string; locale: string }> = {
      'pt-BR': { currency: 'BRL', locale: 'pt-BR' },
      'pt-PT': { currency: 'EUR', locale: 'pt-PT' },
      'es-ES': { currency: 'EUR', locale: 'es-ES' },
      'en-US': { currency: 'USD', locale: 'en-US' },
      'fr-FR': { currency: 'EUR', locale: 'fr-FR' },
    };

    const config = currencyMap[locale];
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return { t, locale, setLocale, isTransitioning, formatCurrency };
}
