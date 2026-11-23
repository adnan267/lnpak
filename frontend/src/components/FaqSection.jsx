import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import FormattedText from './FormattedText';
import { useLanguage } from '../context/LanguageContext';

/**
 * Accordion list of FAQs, grouped by category.
 *   <FaqSection page="home" />          questions the admin assigned to the Home page (renders nothing when there are none)
 *   <FaqSection showFilter showEmpty /> every question, with category chips (the /faq page)
 */
export default function FaqSection({ page, title, showFilter = false, showEmpty = false }) {
  const { t, localized, lang } = useLanguage();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/faqs', { params: page ? { page } : {} })
      .then(({ data }) => !cancelled && setFaqs(data.faqs))
      .catch(() => !cancelled && setFaqs([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  const categoryName = (faq) => faq.category_translations?.[lang]?.name || faq.category_name || t('faq.general');

  const groups = useMemo(() => {
    const map = new Map();
    for (const faq of faqs) {
      const key = faq.category_id ?? 'none';
      if (category !== 'all' && String(key) !== String(category)) continue;
      if (!map.has(key)) map.set(key, { key, name: categoryName(faq), items: [] });
      map.get(key).items.push(faq);
    }
    return [...map.values()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqs, category, lang]);

  const categories = useMemo(() => {
    const seen = new Map();
    for (const faq of faqs) {
      const key = faq.category_id ?? 'none';
      if (!seen.has(key)) seen.set(key, categoryName(faq));
    }
    return [...seen.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqs, lang]);

  if (loading) return null;
  if (!faqs.length) {
    return showEmpty ? <p className="text-muted">{t('faq.none')}</p> : null;
  }

  return (
    <section className="py-5">
      <div className="container" style={{ maxWidth: 900 }}>
        <h2 className="fw-bold mb-4 text-center">{title || t('faq.title')}</h2>

        {showFilter && categories.length > 1 && (
          <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
            <button type="button" className={`btn btn-sm ${category === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setCategory('all')}>
              {t('faq.allCategories')}
            </button>
            {categories.map(([key, name]) => (
              <button
                key={key}
                type="button"
                className={`btn btn-sm ${String(category) === String(key) ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCategory(key)}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {groups.map((group) => (
          <div key={group.key} className="mb-4">
            {(groups.length > 1 || showFilter) && <h5 className="text-primary mb-3">{group.name}</h5>}
            <div className="accordion">
              {group.items.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div className="accordion-item" key={faq.id}>
                    <h3 className="accordion-header">
                      <button
                        type="button"
                        className={`accordion-button${isOpen ? '' : ' collapsed'}`}
                        aria-expanded={isOpen}
                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                      >
                        {localized(faq, 'question')}
                      </button>
                    </h3>
                    {isOpen && (
                      <div className="accordion-body faq-answer">
                        <FormattedText text={localized(faq, 'answer')} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
