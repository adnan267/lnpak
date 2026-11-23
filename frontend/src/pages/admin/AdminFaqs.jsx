import { useEffect, useState } from 'react';
import api from '../../api/axios';
import CheckboxGroup, { ErrorList } from '../../components/admin/CheckboxGroup';
import TranslationFields from '../../components/admin/TranslationFields';
import { FAQ_PAGES } from '../../constants';

const emptyFaq = { id: null, question: '', answer: '', category_id: '', sort_order: '0', is_active: true, pages: [], translations: {} };
const emptyCat = { id: null, name: '', sort_order: '0', translations: {} };

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [faq, setFaq] = useState(null); // form being edited
  const [cat, setCat] = useState(null);
  const [errors, setErrors] = useState([]);
  const [pageFilter, setPageFilter] = useState('');

  function load() {
    api.get('/faqs?all=1').then(({ data }) => setFaqs(data.faqs));
    api.get('/faqs/categories').then(({ data }) => setCategories(data.categories));
  }
  useEffect(load, []);

  function editFaq(f) {
    setErrors([]);
    setFaq({
      id: f.id, question: f.question, answer: f.answer, category_id: f.category_id ? String(f.category_id) : '',
      sort_order: String(f.sort_order ?? 0), is_active: Boolean(f.is_active), pages: f.pages || [], translations: f.translations || {},
    });
  }

  async function saveFaq(e) {
    e.preventDefault();
    setErrors([]);
    const body = { ...faq, pages: faq.pages.join(',') };
    try {
      if (faq.id) await api.put(`/faqs/${faq.id}`, body);
      else await api.post('/faqs', body);
      setFaq(null);
      load();
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || 'Could not save.']);
    }
  }

  async function removeFaq(f) {
    if (!confirm('Delete this question?')) return;
    await api.delete(`/faqs/${f.id}`);
    load();
  }

  async function saveCat(e) {
    e.preventDefault();
    setErrors([]);
    try {
      if (cat.id) await api.put(`/faqs/categories/${cat.id}`, cat);
      else await api.post('/faqs/categories', cat);
      setCat(null);
      load();
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || 'Could not save.']);
    }
  }

  async function removeCat(c) {
    if (!confirm(`Delete category "${c.name}"? Its questions stay but become uncategorised.`)) return;
    await api.delete(`/faqs/categories/${c.id}`);
    load();
  }

  const shown = pageFilter ? faqs.filter((f) => (f.pages || []).includes(pageFilter)) : faqs;

  return (
    <>
      <h1 className="fw-bold mb-4">FAQs</h1>
      {!faq && !cat && <ErrorList errors={errors} />}

      {faq && (
        <form onSubmit={saveFaq} className="card p-4 shadow-sm mb-4" style={{ maxWidth: 760 }}>
          <h5>{faq.id ? 'Edit question' : 'New question'}</h5>
          <ErrorList errors={errors} />
          <div className="mb-3"><label className="form-label">Question</label><input className="form-control" maxLength={500} value={faq.question} onChange={(e) => setFaq({ ...faq, question: e.target.value })} required /></div>
          <div className="mb-3"><label className="form-label">Answer</label><textarea rows={5} className="form-control" value={faq.answer} onChange={(e) => setFaq({ ...faq, answer: e.target.value })} required></textarea></div>
          <div className="row g-3 mb-3">
            <div className="col-sm-6">
              <label className="form-label">Category</label>
              <select className="form-select" value={faq.category_id} onChange={(e) => setFaq({ ...faq, category_id: e.target.value })}>
                <option value="">— No category —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-sm-6"><label className="form-label">Order (lower first)</label><input type="number" className="form-control" value={faq.sort_order} onChange={(e) => setFaq({ ...faq, sort_order: e.target.value })} /></div>
          </div>
          <div className="mb-3">
            <label className="form-label d-block">Show on these pages</label>
            <CheckboxGroup idPrefix="faq-page" options={FAQ_PAGES.map((p) => ({ key: p.key, label: p.label }))} value={faq.pages} onChange={(pages) => setFaq({ ...faq, pages })} />
            <div className="form-text">Every visible question also appears on the main FAQ page.</div>
          </div>
          <TranslationFields value={faq.translations} onChange={(translations) => setFaq({ ...faq, translations })} fields={[{ name: 'question', label: 'Question' }, { name: 'answer', label: 'Answer', textarea: true }]} />
          <div className="form-check mb-3">
            <input type="checkbox" id="faq_active" className="form-check-input" checked={faq.is_active} onChange={(e) => setFaq({ ...faq, is_active: e.target.checked })} />
            <label htmlFor="faq_active" className="form-check-label">Visible</label>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit">Save</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setFaq(null)}>Cancel</button>
          </div>
        </form>
      )}

      {cat && (
        <form onSubmit={saveCat} className="card p-4 shadow-sm mb-4" style={{ maxWidth: 560 }}>
          <h5>{cat.id ? 'Edit category' : 'New category'}</h5>
          <ErrorList errors={errors} />
          <div className="mb-3"><label className="form-label">Name</label><input className="form-control" maxLength={150} value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} required /></div>
          <div className="mb-3"><label className="form-label">Order (lower first)</label><input type="number" className="form-control" value={cat.sort_order} onChange={(e) => setCat({ ...cat, sort_order: e.target.value })} /></div>
          <TranslationFields value={cat.translations} onChange={(translations) => setCat({ ...cat, translations })} fields={[{ name: 'name', label: 'Category name' }]} />
          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit">Save</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setCat(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Categories</strong>
              <button className="btn btn-sm btn-primary" onClick={() => { setErrors([]); setCat({ ...emptyCat }); }}><i className="bi bi-plus-lg"></i></button>
            </div>
            <ul className="list-group list-group-flush">
              {categories.map((c) => (
                <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <span>{c.name}</span>
                  <span className="text-nowrap">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => { setErrors([]); setCat({ id: c.id, name: c.name, sort_order: String(c.sort_order ?? 0), translations: c.translations || {} }); }}><i className="bi bi-pencil"></i></button>{' '}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removeCat(c)}><i className="bi bi-trash"></i></button>
                  </span>
                </li>
              ))}
              {categories.length === 0 && <li className="list-group-item text-muted">No categories yet.</li>}
            </ul>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
            <select className="form-select" style={{ maxWidth: 280 }} value={pageFilter} onChange={(e) => setPageFilter(e.target.value)}>
              <option value="">All pages</option>
              {FAQ_PAGES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
            <button className="btn btn-primary" onClick={() => { setErrors([]); setFaq({ ...emptyFaq, pages: pageFilter ? [pageFilter] : [] }); }}><i className="bi bi-plus-lg"></i> Add Question</button>
          </div>
          <div className="card shadow-sm">
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead className="table-light"><tr><th>Question</th><th>Category</th><th>Pages</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
                <tbody>
                  {shown.map((f) => (
                    <tr key={f.id}>
                      <td>{f.question}</td>
                      <td>{f.category_name || <span className="text-muted">—</span>}</td>
                      <td className="small">{(f.pages || []).map((k) => FAQ_PAGES.find((p) => p.key === k)?.label || k).join(', ') || '—'}</td>
                      <td>{f.is_active ? <span className="badge bg-success">Visible</span> : <span className="badge bg-secondary">Hidden</span>}</td>
                      <td className="text-end text-nowrap">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => editFaq(f)}><i className="bi bi-pencil"></i></button>{' '}
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeFaq(f)}><i className="bi bi-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                  {shown.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">No questions found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
