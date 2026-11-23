import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

/**
 * Shows a stored amount in the visitor's chosen currency, written as the admin chose
 * (symbol, text or both — see Admin > Settings).
 *   <Price amount={12000} currency="GBP" />
 *   <Price min={8000} max={12000} currency="GBP" showOriginal />    -> a range
 * Renders nothing when there is no amount.
 */
export default function Price({ amount, min, max, currency, showOriginal = false, className = '' }) {
  const { display, displayRange } = useCurrency();
  const { t } = useLanguage();

  const isRange = min !== undefined && max !== undefined && min !== null && max !== null;
  const single = isRange ? null : amount;
  if (!isRange && (single === null || single === undefined || single === '' || Number.isNaN(Number(single)))) return null;

  const { text, original, converted } = isRange
    ? displayRange(min, max, currency || 'USD')
    : display(single, currency || 'USD');

  return (
    <span className={className}>
      {/* dir="ltr" keeps "£12,000 GBP" intact inside any text direction */}
      <span dir="ltr" className="d-inline-block">{text}</span>
      {showOriginal && converted && (
        <small className="text-muted d-block">{t('uni.originalFee', { amount: original })}</small>
      )}
    </span>
  );
}
