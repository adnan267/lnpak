import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, translations } from '../i18n/translations';
import { COUNTRY_NAMES } from '../i18n/countries';

const STORAGE_KEY = 'lnpak_lang';
const LanguageContext = createContext(null);

function readStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.some((l) => l.code === stored)) return stored;
  } catch {
    /* storage can be blocked (private mode) — fall back to English */
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  // Keep <html lang> in sync (helps screen readers, translation prompts and Chinese/Russian font selection).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => {
    /** t('home.heroTitle') or t('dashboard.welcome', { name: 'Ali' }); falls back to English, then the key. */
    function t(key, vars) {
      const text = translations[lang]?.[key] ?? translations.en[key] ?? key;
      if (!vars) return text;
      return text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] !== undefined ? vars[name] : match));
    }

    /** Text stored in the database: uses the Russian/Chinese translation when present, else the English column. */
    function localized(record, field) {
      return record?.translations?.[lang]?.[field] || record?.[field] || '';
    }

    function countryLabel(name) {
      if (!name) return name;
      return COUNTRY_NAMES[lang]?.[name] || name;
    }

    return { lang, setLang, t, localized, countryLabel, languages: LANGUAGES };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
