import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocalLanguage } from "../Services/storage";

// Import translations
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import fr from '../locales/fr.json';
import pa from '../locales/pa.json';

// Available languages
const resources = { en: { translation: en }, hi: { translation: hi }, fr: { translation: fr }, pa: { translation: pa } };

// Initialize i18n
i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default language
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Load language from storage

const loadLanguage = async () => {
    try {
      const savedLanguage = await getLocalLanguage('appLanguage');
      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error("Failed to load language from storage:", error);
    }
};

loadLanguage();

export default i18n;
