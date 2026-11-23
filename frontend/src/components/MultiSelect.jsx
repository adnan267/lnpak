import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Filter that lets the visitor pick "All" or one or more specific values (countries, languages).
 *   selected = []  means "All" (no filtering).
 * Opens and closes with React state, so it does not depend on Bootstrap's JavaScript.
 */
export default function MultiSelect({ label, allLabel, options, selected, onChange }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Close when clicking elsewhere or pressing Escape.
  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const summary = selected.length === 0
    ? allLabel
    : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || selected[0]
      : t('filter.selected', { n: selected.length });

  return (
    <div className="position-relative filter-dropdown" ref={rootRef}>
      <button
        type="button"
        className="btn btn-outline-secondary dropdown-toggle"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((o) => !o)}
      >
        {summary}
      </button>
      {open && (
        <div className="dropdown-menu show p-2" role="listbox" aria-label={label}>
          <div className="form-check mb-1">
            <input
              className="form-check-input"
              type="checkbox"
              id={`${label}-all`}
              checked={selected.length === 0}
              onChange={() => onChange([])}
            />
            <label className="form-check-label fw-semibold" htmlFor={`${label}-all`}>{allLabel}</label>
          </div>
          <hr className="my-1" />
          {options.map((option) => (
            <div className="form-check" key={option.value}>
              <input
                className="form-check-input"
                type="checkbox"
                id={`${label}-${option.value}`}
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
              <label className="form-check-label" htmlFor={`${label}-${option.value}`}>{option.label}</label>
            </div>
          ))}
          {options.length === 0 && <div className="text-muted small px-1">—</div>}
        </div>
      )}
    </div>
  );
}
