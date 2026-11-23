import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

/** Language + currency pickers shown in the navbar. Plain <select>s, so they work on mobile with no extra JS. */
export default function LocaleSwitchers() {
  const { lang, setLang, languages, t } = useLanguage();
  const { currency, setCurrency, currencies } = useCurrency();

  return (
    <div className="d-flex align-items-center gap-2 locale-switchers">
      <select
        className="form-select form-select-sm"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label={t('nav.language')}
        title={t('nav.language')}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
      {/* With only one currency enabled in Admin > Settings there is nothing to choose, so the picker is hidden. */}
      {currencies.length > 1 && (
        <select
          className="form-select form-select-sm"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          aria-label={t('nav.currency')}
          title={t('nav.currency')}
        >
          {currencies.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      )}
    </div>
  );
}
