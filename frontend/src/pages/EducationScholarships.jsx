import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import FaqSection from '../components/FaqSection';
import MultiSelect from '../components/MultiSelect';
import ScholarshipCard from '../components/ScholarshipCard';
import UniversityCard from '../components/UniversityCard';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { FUNDING_SOURCES, SCHOLARSHIP_TYPES, STUDY_LEVELS, TEACHING_LANGUAGES } from '../constants';

const emptyUniFilters = { q: '', countries: [], languages: [], scholarship: '', funding: '', sort: 'name' };
const emptySchFilters = { q: '', countries: [], languages: [], type: '', funding: '', level: '', sort: 'deadline' };

/** Waits for the visitor to stop typing before the search text is used. */
function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export default function EducationScholarships() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'scholarships' ? 'scholarships' : 'universities';

  // Each tab remembers its own filters while the visitor switches between them.
  const [uniFilters, setUniFilters] = useState(emptyUniFilters);
  const [schFilters, setSchFilters] = useState(emptySchFilters);

  function setTab(next) {
    setSearchParams(next === 'scholarships' ? { tab: 'scholarships' } : {}, { replace: true });
  }

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="fw-bold mb-2">{t('edu.title')}</h1>
          <p className="text-muted mb-4">{t('edu.subtitle')}</p>

          <ul className="nav nav-pills tab-pills mb-4" role="tablist">
            {['universities', 'scholarships'].map((key) => (
              <li className="nav-item" role="presentation" key={key}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  className={`nav-link${tab === key ? ' active' : ''}`}
                  onClick={() => setTab(key)}
                >
                  {t(key === 'universities' ? 'edu.tabUniversities' : 'edu.tabScholarships')}
                </button>
              </li>
            ))}
          </ul>

          {tab === 'universities'
            ? <UniversitiesTab filters={uniFilters} setFilters={setUniFilters} />
            : <ScholarshipsTab filters={schFilters} setFilters={setSchFilters} />}
        </div>
      </section>
      <FaqSection page="education-scholarships" />
    </>
  );
}

/** Country + language pickers shared by both tabs ("All" or specific ones). */
function CommonFilters({ filters, update, countries }) {
  const { t, countryLabel } = useLanguage();
  return (
    <>
      <div className="col-lg-4">
        <input
          type="search"
          className="form-control"
          placeholder={t('filter.search')}
          aria-label={t('filter.search')}
          value={filters.q}
          onChange={(e) => update('q', e.target.value)}
        />
      </div>
      <div className="col-6 col-lg-2">
        <MultiSelect
          label={t('filter.country')}
          allLabel={t('filter.allCountries')}
          options={countries.map((c) => ({ value: c, label: countryLabel(c) }))}
          selected={filters.countries}
          onChange={(value) => update('countries', value)}
        />
      </div>
      <div className="col-6 col-lg-2">
        <MultiSelect
          label={t('filter.language')}
          allLabel={t('filter.allLanguages')}
          options={TEACHING_LANGUAGES.map((l) => ({ value: l, label: t(`lang.${l}`) }))}
          selected={filters.languages}
          onChange={(value) => update('languages', value)}
        />
      </div>
    </>
  );
}

function UniversitiesTab({ filters, setFilters }) {
  const { t } = useLanguage();
  const { toSelected } = useCurrency();
  const q = useDebounced(filters.q.trim());

  const [universities, setUniversities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Fee sorting happens in the browser (below) because it must compare in ONE currency.
  const serverSort = filters.sort === 'ranking' ? 'ranking' : 'name';
  const countriesKey = filters.countries.join(',');
  const languagesKey = filters.languages.join(',');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/universities', {
        params: {
          q: q || undefined,
          country: countriesKey || undefined,
          languages: languagesKey || undefined,
          scholarship: filters.scholarship || undefined,
          funding: filters.funding || undefined,
          sort: serverSort,
        },
      })
      .then(({ data }) => {
        if (cancelled) return;
        setUniversities(data.universities);
        setCountries(data.countries);
        setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, countriesKey, languagesKey, filters.scholarship, filters.funding, serverSort]);

  const sorted = useMemo(() => {
    if (filters.sort !== 'fee_asc' && filters.sort !== 'fee_desc') return universities;
    const direction = filters.sort === 'fee_asc' ? 1 : -1;
    return universities
      .map((u) => ({
        u,
        // Ranges are sorted by their lowest amount; universities without a number go last.
        value: u.tuition_fee === null || u.tuition_fee === undefined ? null : toSelected(u.tuition_fee, u.fee_currency),
      }))
      .sort((a, b) => {
        if (a.value === null && b.value === null) return a.u.name.localeCompare(b.u.name);
        if (a.value === null) return 1;
        if (b.value === null) return -1;
        return (a.value - b.value) * direction;
      })
      .map((x) => x.u);
  }, [universities, filters.sort, toSelected]);

  function update(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
  }

  const hasFilters = filters.q || filters.countries.length || filters.languages.length || filters.scholarship || filters.funding;

  return (
    <>
      <div className="card uni-filters p-3 mb-4">
        <div className="row g-2 align-items-end">
          <CommonFilters filters={filters} update={update} countries={countries} />
          <div className="col-6 col-lg-2">
            <select className="form-select" aria-label={t('filter.scholarship')} value={filters.scholarship} onChange={(e) => update('scholarship', e.target.value)}>
              <option value="">{t('filter.scholarship')}: {t('filter.anyScholarship')}</option>
              <option value="any">{t('filter.hasScholarship')}</option>
              {SCHOLARSHIP_TYPES.map((s) => <option key={s} value={s}>{t(`sch.type.${s}`)}</option>)}
            </select>
          </div>
          <div className="col-6 col-lg-2">
            <select className="form-select" aria-label={t('filter.funding')} value={filters.funding} onChange={(e) => update('funding', e.target.value)}>
              <option value="">{t('filter.allFunding')}</option>
              {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{t(`sch.source.${s}`)}</option>)}
            </select>
          </div>
          <div className="col-6 col-lg-3">
            <select className="form-select" aria-label={t('filter.sort')} value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
              <option value="name">{t('sort.name')}</option>
              <option value="fee_asc">{t('sort.feeAsc')}</option>
              <option value="fee_desc">{t('sort.feeDesc')}</option>
              <option value="ranking">{t('sort.ranking')}</option>
            </select>
          </div>
          {hasFilters && (
            <div className="col-auto">
              <button type="button" className="btn btn-link p-0" onClick={() => setFilters({ ...emptyUniFilters, sort: filters.sort })}>
                {t('filter.reset')}
              </button>
            </div>
          )}
        </div>
      </div>

      {!loading && !failed && <p className="text-muted small">{t('edu.resultsUni', { count: sorted.length })}</p>}

      <div className="row g-4">
        {sorted.map((university) => (
          <div className="col-md-6 col-lg-4" key={university.id}>
            <UniversityCard university={university} />
          </div>
        ))}
      </div>

      {loading && universities.length === 0 && <p className="text-muted text-center">{t('common.loading')}</p>}
      {!loading && !failed && sorted.length === 0 && <p className="text-muted text-center">{t('uni.none')}</p>}
      {failed && <p className="text-danger text-center">{t('common.error')}</p>}
      {!loading && sorted.length > 0 && <p className="text-muted small mt-4 mb-0">{t('uni.feeNote')}</p>}
    </>
  );
}

function ScholarshipsTab({ filters, setFilters }) {
  const { t } = useLanguage();
  const q = useDebounced(filters.q.trim());

  const [scholarships, setScholarships] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const countriesKey = filters.countries.join(',');
  const languagesKey = filters.languages.join(',');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/scholarships', {
        params: {
          q: q || undefined,
          country: countriesKey || undefined,
          languages: languagesKey || undefined,
          type: filters.type || undefined,
          funding: filters.funding || undefined,
          level: filters.level || undefined,
          sort: filters.sort,
        },
      })
      .then(({ data }) => {
        if (cancelled) return;
        setScholarships(data.scholarships);
        setCountries(data.countries);
        setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, countriesKey, languagesKey, filters.type, filters.funding, filters.level, filters.sort]);

  function update(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
  }

  const hasFilters = filters.q || filters.countries.length || filters.languages.length || filters.type || filters.funding || filters.level;

  return (
    <>
      <div className="card uni-filters p-3 mb-4">
        <div className="row g-2 align-items-end">
          <CommonFilters filters={filters} update={update} countries={countries} />
          <div className="col-6 col-lg-2">
            <select className="form-select" aria-label={t('filter.type')} value={filters.type} onChange={(e) => update('type', e.target.value)}>
              <option value="">{t('filter.allTypes')}</option>
              {SCHOLARSHIP_TYPES.map((s) => <option key={s} value={s}>{t(`sch.type.${s}`)}</option>)}
            </select>
          </div>
          <div className="col-6 col-lg-3">
            <select className="form-select" aria-label={t('filter.funding')} value={filters.funding} onChange={(e) => update('funding', e.target.value)}>
              <option value="">{t('filter.allFunding')}</option>
              {FUNDING_SOURCES.map((s) => <option key={s} value={s}>{t(`sch.source.${s}`)}</option>)}
            </select>
          </div>
          <div className="col-6 col-lg-2">
            <select className="form-select" aria-label={t('filter.level')} value={filters.level} onChange={(e) => update('level', e.target.value)}>
              <option value="">{t('filter.allLevels')}</option>
              {STUDY_LEVELS.filter((l) => l !== 'any').map((l) => <option key={l} value={l}>{t(`level.${l}`)}</option>)}
            </select>
          </div>
          <div className="col-6 col-lg-3">
            <select className="form-select" aria-label={t('filter.sort')} value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
              <option value="deadline">{t('sort.deadline')}</option>
              <option value="title">{t('sort.name')}</option>
            </select>
          </div>
          {hasFilters && (
            <div className="col-auto">
              <button type="button" className="btn btn-link p-0" onClick={() => setFilters({ ...emptySchFilters, sort: filters.sort })}>
                {t('filter.reset')}
              </button>
            </div>
          )}
        </div>
      </div>

      {!loading && !failed && <p className="text-muted small">{t('edu.resultsSch', { count: scholarships.length })}</p>}

      <div className="row g-4">
        {scholarships.map((scholarship) => (
          <div className="col-md-6 col-lg-4" key={scholarship.id}>
            <ScholarshipCard scholarship={scholarship} />
          </div>
        ))}
      </div>

      {loading && scholarships.length === 0 && <p className="text-muted text-center">{t('common.loading')}</p>}
      {!loading && !failed && scholarships.length === 0 && <p className="text-muted text-center">{t('sch.none')}</p>}
      {failed && <p className="text-danger text-center">{t('common.error')}</p>}
    </>
  );
}
