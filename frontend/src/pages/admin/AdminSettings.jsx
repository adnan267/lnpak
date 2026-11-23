import { useEffect, useState } from 'react';
import api from '../../api/axios';
import CheckboxGroup, { ErrorList } from '../../components/admin/CheckboxGroup';

const FORMAT_LABELS = { symbol: 'Symbol only ($1,200)', text: 'Code only (USD 1,200)', both: 'Symbol and code ($1,200 USD)' };

export default function AdminSettings() {
  const [meta, setMeta] = useState(null);
  const [enabled, setEnabled] = useState([]);
  const [def, setDef] = useState('USD');
  const [format, setFormat] = useState('both');
  const [errors, setErrors] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings').then(({ data }) => {
      setMeta(data);
      setEnabled(data.currency.enabled);
      setDef(data.currency.default);
      setFormat(data.currency.format);
    });
  }, []);

  async function save(e) {
    e.preventDefault();
    setErrors([]);
    setSaved(false);
    try {
      await api.put('/settings', { enabled, default: def, format });
      setSaved(true);
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || 'Could not save.']);
    }
  }

  if (!meta) return <div className="text-muted">Loading...</div>;

  return (
    <>
      <h1 className="fw-bold mb-4">Currency Settings</h1>
      <ErrorList errors={errors} />
      {saved && <div className="alert alert-success">Settings saved.</div>}
      <form onSubmit={save} className="card p-4 shadow-sm" style={{ maxWidth: 620 }}>
        <div className="mb-3">
          <label className="form-label d-block">Currencies visitors can choose from</label>
          <CheckboxGroup
            idPrefix="cur"
            options={meta.currencies.map((c) => ({ key: c, label: `${c} (${meta.symbols[c] || c})` }))}
            value={enabled}
            onChange={(list) => { setEnabled(list); if (!list.includes(def) && list.length) setDef(list[0]); }}
          />
          <div className="form-text">If only one currency is ticked, the currency selector is hidden from visitors.</div>
        </div>
        <div className="mb-3">
          <label className="form-label">Default currency</label>
          <select className="form-select" value={def} onChange={(e) => setDef(e.target.value)}>
            {enabled.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">How prices are written</label>
          <select className="form-select" value={format} onChange={(e) => setFormat(e.target.value)}>
            {meta.formats.map((f) => <option key={f} value={f}>{FORMAT_LABELS[f] || f}</option>)}
          </select>
        </div>
        <button className="btn btn-primary align-self-start" type="submit">Save settings</button>
      </form>
    </>
  );
}
