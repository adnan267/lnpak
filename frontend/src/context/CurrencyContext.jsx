import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const STORAGE_KEY = 'lnpak_currency';
const ALL_CURRENCIES = ['USD', 'EUR', 'CNY', 'PKR', 'INR', 'RUB', 'TRY', 'GBP'];
const FALLBACK_SYMBOLS = { USD: '$', EUR: '€', CNY: '¥', PKR: '₨', INR: '₹', RUB: '₽', TRY: '₺', GBP: '£' };

const CurrencyContext = createContext(null);

function readStoredCurrency() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function groupDigits(amount) {
  const digits = Math.abs(amount) < 100 ? 2 : 0;
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(amount);
}

export function CurrencyProvider({ children }) {
  const [settings, setSettings] = useState({
    enabled: ALL_CURRENCIES,
    default: 'USD',
    format: 'both',
    symbols: FALLBACK_SYMBOLS,
  });
  const [rates, setRates] = useState(null); // { PKR: 280, ... } units per 1 USD
  const [ratesSource, setRatesSource] = useState(null);
  const [chosen, setChosen] = useState(readStoredCurrency);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/currency')
      .then(({ data }) => {
        if (cancelled) return;
        setRates(data.rates);
        setRatesSource(data.source);
        setSettings({
          enabled: data.enabled?.length ? data.enabled : ALL_CURRENCIES,
          default: data.default || 'USD',
          format: data.format || 'both',
          symbols: { ...FALLBACK_SYMBOLS, ...(data.symbols || {}) },
        });
      })
      .catch(() => {
        /* no rates: prices simply stay in their original currency */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The visitor's choice only counts while the admin still offers that currency.
  const currency = settings.enabled.includes(chosen) ? chosen : settings.default;

  const setCurrency = useCallback((code) => {
    setChosen(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => {
    const { symbols, format } = settings;

    /** 1200 + 'USD' -> "$1,200" | "USD 1,200" | "$1,200 USD", depending on the admin's price-format setting. */
    function format_(amount, code) {
      const number = groupDigits(Number(amount));
      const symbol = symbols[code] || code;
      if (format === 'symbol') return `${symbol}${number}`;
      if (format === 'text') return `${code} ${number}`;
      return `${symbol}${number} ${code}`;
    }

    /** Converts into the visitor's currency, or returns null when that is not possible. */
    function convert(amount, from) {
      const value = Number(amount);
      if (!Number.isFinite(value)) return null;
      if (from === currency) return value;
      if (!rates || !rates[from] || !rates[currency]) return null;
      return (value / rates[from]) * rates[currency];
    }

    /**
     * display(1200, 'GBP') -> { text: 'PKR 426,000', original: 'GBP 1,200', converted: true }
     * When rates are missing the original amount is shown unconverted.
     */
    function display(amount, from) {
      const original = format_(amount, from);
      const value = convert(amount, from);
      if (value === null || from === currency) return { text: original, original, converted: false };
      return { text: format_(value, currency), original, converted: true };
    }

    /** { min, max } display for fee ranges (same currency conversion for both ends). */
    function displayRange(min, max, from) {
      const lo = display(min, from);
      const hi = display(max, from);
      const loValue = convert(min, from);
      const hiValue = convert(max, from);
      if (loValue === null || hiValue === null || from === currency) {
        return { text: `${format_(min, from)} – ${format_(max, from)}`, original: `${format_(min, from)} – ${format_(max, from)}`, converted: false };
      }
      return {
        text: `${format_(loValue, currency)} – ${format_(hiValue, currency)}`,
        original: `${lo.original} – ${hi.original}`,
        converted: true,
      };
    }

    return {
      currency,
      setCurrency,
      currencies: settings.enabled,
      ratesSource,
      ratesReady: Boolean(rates),
      display,
      displayRange,
      /** Amount in the visitor's currency as a plain number (for sorting); null if it cannot be converted. */
      toSelected: convert,
    };
  }, [settings, currency, setCurrency, ratesSource, rates]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export { ALL_CURRENCIES };
