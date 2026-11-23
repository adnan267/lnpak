const LANGS = [
  { code: 'ru', label: 'Russian (Русский)' },
  { code: 'zh', label: 'Chinese (中文)' },
];

/**
 * Optional Russian / Chinese versions of the text fields on an admin form.
 *   value:    { ur: { title: '...' }, ar: { ... } }
 *   fields:   [{ name: 'title', label: 'Title' }, { name: 'description', label: 'Description', textarea: true }]
 * Anything left blank falls back to the English text on the public site.
 */
export default function TranslationFields({ value, onChange, fields }) {
  function setField(lang, field, text) {
    onChange({ ...value, [lang]: { ...(value[lang] || {}), [field]: text } });
  }

  return (
    <div className="border rounded p-3 mb-3 bg-light">
      <h6 className="fw-semibold mb-1">Translations (optional)</h6>
      <p className="small text-muted mb-3">Leave a box empty to show the English text for that language.</p>

      {LANGS.map((lang) => (
        <div key={lang.code} className="mb-3">
          <div className="fw-semibold mb-2">{lang.label}</div>
          {fields.map((field) => (
            <div className="mb-2" key={field.name}>
              <label className="form-label small mb-1">{field.label}</label>
              {field.textarea ? (
                <textarea
                  rows={4}
                  className="form-control"
                  value={value[lang.code]?.[field.name] || ''}
                  onChange={(e) => setField(lang.code, field.name, e.target.value)}
                ></textarea>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={value[lang.code]?.[field.name] || ''}
                  onChange={(e) => setField(lang.code, field.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
