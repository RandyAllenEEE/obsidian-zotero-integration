import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/index.json';
import zh from './locales/zh/index.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

// Detect system language
const getDefaultLanguage = () => {
  // Try to get language from localStorage (user preference)
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('obsidian-zotero-lang');
    if (saved && (saved === 'en' || saved === 'zh')) {
      return saved;
    }
  }

  // Default to English
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDefaultLanguage(),
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    fallbackLng: 'en',
  });

export default i18n;
