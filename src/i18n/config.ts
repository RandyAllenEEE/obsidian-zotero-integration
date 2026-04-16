import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/index.json';
import zh from './locales/zh/index.json';

const resources = {
  en: { translation: en },
  zh: { translation: zh },
};

// Initialize i18n with default settings
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Will be updated dynamically in plugin onload
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    fallbackLng: 'en',
  });

// Function to detect and set the appropriate language
export const detectAndSetLanguage = (app: any) => {
  // Try to get language from localStorage (user preference)
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('obsidian-zotero-lang');
    if (saved && (saved === 'en' || saved === 'zh')) {
      i18n.changeLanguage(saved);
      return;
    }
  }

  // Try to detect Obsidian app language from vault config
  try {
    const obsidianLocale = app.vault?.config?.locale;
    if (obsidianLocale) {
      if (obsidianLocale.startsWith('zh')) {
        i18n.changeLanguage('zh');
        return;
      }
    }
  } catch (e) {
    // Ignore errors if vault config is not accessible
  }

  // Fallback to system language
  const systemLang = typeof navigator !== 'undefined' ? navigator.language : 'en';
  if (systemLang.startsWith('zh')) {
    i18n.changeLanguage('zh');
    return;
  }

  // Default to English
  i18n.changeLanguage('en');
};

export const setLanguagePreference = (lang: string) => {
  if (lang === 'en' || lang === 'zh') {
    localStorage.setItem('obsidian-zotero-lang', lang);
    i18n.changeLanguage(lang);
  }
};

export default i18n;