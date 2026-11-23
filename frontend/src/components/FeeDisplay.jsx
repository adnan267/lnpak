import Price from './Price';
import { useLanguage } from '../context/LanguageContext';

/**
 * Shows a university's tuition fee in whichever format the admin chose:
 *   single -> one amount    range -> "from – to"    text -> words only    none -> "Fee on request"
 * Optional fee text is shown next to the numbers.
 */
export default function FeeDisplay({ university, showOriginal = false, perYear = true }) {
  const { t, localized } = useLanguage();
  const { fee_mode: mode, tuition_fee: min, tuition_fee_max: max, fee_currency: currency } = university;
  const text = localized(university, 'fee_text');

  const hasNumbers = (mode === 'single' && min !== null && min !== undefined)
    || (mode === 'range' && min !== null && max !== null && min !== undefined && max !== undefined);

  if (!hasNumbers && !text) {
    return <span className="text-muted">{t('uni.feeOnRequest')}</span>;
  }

  return (
    <span>
      {hasNumbers && (
        <>
          <strong>
            {mode === 'range'
              ? <Price min={min} max={max} currency={currency} showOriginal={showOriginal} />
              : <Price amount={min} currency={currency} showOriginal={showOriginal} />}
          </strong>
          {perYear && <span className="text-muted"> / {t('uni.perYear')}</span>}
        </>
      )}
      {text && <span className={hasNumbers ? 'd-block small text-muted' : ''}>{text}</span>}
    </span>
  );
}
