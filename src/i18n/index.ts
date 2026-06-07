import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ps from './locales/ps.json';

// Get saved language from settings or use default
const getSavedLanguage = (): string => {
  try {
    const saved = localStorage.getItem('app-language');
    return saved || 'en';
  } catch {
    return 'en';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ps: { translation: ps },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('app-language', lng);
    // Update document direction for RTL languages
    document.documentElement.dir = ['fa', 'ps'].includes(lng) ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  } catch {
    // Ignore storage errors
  }
});

export default i18n;

// Helper function to change language
export const changeLanguage = async (lng: 'en' | 'ps'): Promise<void> => {
  await i18n.changeLanguage(lng);
};

// Helper to check if current language is RTL
export const isRTL = (): boolean => {
  return i18n.language === 'ps';
};

// Helper to get current language direction
export const getDirection = (): 'rtl' | 'ltr' => {
  return isRTL() ? 'rtl' : 'ltr';
};
