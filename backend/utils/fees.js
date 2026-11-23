const { FEE_MODES } = require('./enums');
const { normaliseCurrency, parseMoney } = require('./currencies');
const { readEnum, textOrNull } = require('./validate');

/**
 * Reads the tuition-fee fields of a form. Four formats:
 *   single  one amount            (tuition_fee)
 *   range   from - to             (tuition_fee .. tuition_fee_max)
 *   text    words only            (fee_text, e.g. "Free for government-funded students")
 *   none    shown as "Fee on request"
 * `fee_text` may be added to any format and is shown alongside the numbers.
 * Returns { errors } or { values }.
 */
function readFee(body) {
  const errors = [];
  const fee_mode = readEnum(body.fee_mode, FEE_MODES, 'none');
  const fee_currency = normaliseCurrency(body.fee_currency);
  const fee_text = textOrNull(body.fee_text, 255);

  let amount = null;
  let max = null;

  if (fee_mode === 'single' || fee_mode === 'range') {
    amount = parseMoney(body.tuition_fee);
    if (amount === undefined || amount === null) {
      errors.push(fee_mode === 'range' ? 'Enter the lowest fee of the range.' : 'Enter the fee amount.');
    }
  }
  if (fee_mode === 'range') {
    max = parseMoney(body.tuition_fee_max);
    if (max === undefined || max === null) errors.push('Enter the highest fee of the range.');
    else if (typeof amount === 'number' && max < amount) errors.push('The highest fee must not be lower than the lowest fee.');
  }
  if (fee_mode === 'text' && !fee_text) errors.push('Write the fee description text.');

  if (errors.length) return { errors };
  return {
    values: {
      fee_mode,
      tuition_fee: fee_mode === 'single' || fee_mode === 'range' ? amount : null,
      tuition_fee_max: fee_mode === 'range' ? max : null,
      fee_currency,
      fee_text,
    },
  };
}

module.exports = { readFee };
