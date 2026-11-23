/** A row of checkboxes for a set of values (languages, transport, pages). Used by several admin forms. */
export default function CheckboxGroup({ options, value, onChange, idPrefix }) {
  function toggle(key) {
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  }
  return (
    <div className="d-flex flex-wrap gap-3">
      {options.map((opt) => (
        <div className="form-check" key={opt.key}>
          <input type="checkbox" className="form-check-input" id={`${idPrefix}-${opt.key}`} checked={value.includes(opt.key)} onChange={() => toggle(opt.key)} />
          <label className="form-check-label" htmlFor={`${idPrefix}-${opt.key}`}>{opt.label}</label>
        </div>
      ))}
    </div>
  );
}

export function ErrorList({ errors }) {
  if (!errors.length) return null;
  return (
    <div className="alert alert-danger">
      <ul className="mb-0">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
    </div>
  );
}
