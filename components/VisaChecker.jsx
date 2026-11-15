'use client';
import Icon from './Icon';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '../lib/currency';
import { workDaysLabel } from '../lib/destinations';
import { findCountryIso, buildVisaPdfHtml } from '../lib/visaPdf';
import { guideFor } from '../lib/destinationGuide';
import { printDoc } from '../lib/printDoc';
import { openWhatsApp, visaMessage } from '../lib/whatsapp';
import { flagSrc } from '../lib/flags';

// Homepage "visa checker" (Iraqi passport only): pick a destination and see at once the
// visa types, price, processing time and the documents to prepare, with a
// printable checklist (PDF) and a WhatsApp button. Read-only: it uses the
// same public visa APIs as the visa pages.
export default function VisaChecker({ lang = 'ar', embedded = false }) {
  const en = lang === 'en';
  const nm = (ar, enText) => (en && enText ? enText : ar);
  const [cards, setCards] = useState(null);
  const [countryId, setCountryId] = useState('');
  const [cardId, setCardId] = useState('');
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/visa/cards').then((r) => (r.ok ? r.json() : [])).catch(() => []).then((l) => { if (alive) setCards(Array.isArray(l) ? l : []); });
    return () => { alive = false; };
  }, []);

  const countries = useMemo(() => {
    const m = new Map();
    (cards || []).forEach((c) => {
      if (!m.has(c.country_id)) m.set(c.country_id, { id: String(c.country_id), ar: c.country_name_ar, en: c.country_name_en, flag: c.flag_code, sample: c, cards: [] });
      m.get(c.country_id).cards.push(c);
    });
    return [...m.values()].sort((a, b) => String(a.ar).localeCompare(String(b.ar), 'ar'));
  }, [cards]);

  const country = countries.find((c) => c.id === countryId) || null;
  const types = useMemo(() => (country ? [...country.cards].sort((a, b) => (Number(a.adult_price) || 0) - (Number(b.adult_price) || 0)) : []), [country]);

  // Pick the cheapest type when the destination changes.
  useEffect(() => { setCardId(types[0] ? String(types[0].id) : ''); }, [countryId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cardId) { setDetail(null); return undefined; }
    let alive = true;
    setLoading(true);
    fetch('/api/visa/cards/' + cardId).then((r) => (r.ok ? r.json() : null)).catch(() => null).then((d) => {
      if (!alive) return;
      setDetail(d);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [cardId]);

  if (cards && cards.length === 0) return null;
  const natName = en ? 'Iraqi' : 'عراقي';
  const docs = (detail && Array.isArray(detail.documents)) ? detail.documents : [];
  const req = docs.filter((d) => d.required);
  const opt = docs.filter((d) => !d.required);
  const iso = country ? findCountryIso(country.sample) : null;

  async function downloadPdf() {
    if (!detail) return;
    const body = await buildVisaPdfHtml({ cards: [detail], lang, fmtPrice: (n) => formatPrice(n, 'IQD', lang), pageUrl: window.location.origin + '/visa/' + detail.id });
    printDoc(nm(detail.visa_type_name_ar, detail.visa_type_name_en) + ' — ' + nm(detail.country_name_ar, detail.country_name_en), body, lang);
  }

  function ask() {
    const d = detail || types.find((t) => String(t.id) === cardId);
    if (!d) return;
    const msg = visaMessage({
      type: nm(d.visa_type_name_ar, d.visa_type_name_en),
      country: nm(d.country_name_ar, d.country_name_en),
      stay: d.stay_duration,
      issuing: workDaysLabel(d.issuing_time_days, lang),
      validity: d.validity_before_travel,
      url: window.location.origin + '/visa/' + d.id,
    }, lang);
    openWhatsApp(natName ? msg.replace('\n', '\n' + (en ? 'Nationality: ' : 'الجنسية: ') + natName + '\n') : msg);
  }

  const audience = (a) => (a === 'adults' ? (en ? 'adults' : 'للبالغين') : a === 'children' ? (en ? 'children' : 'للأطفال') : '');

  return (
    <section className={embedded ? 'qa-vc-sec qa-vc-embedded' : 'qa-sec qa-vc-sec'} data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <style>{`
.qa-vc{border-radius:var(--qs-r,20px);background:#fff;border:1px solid var(--qs-line,#dbe8ee);padding:32px;display:flex;flex-direction:column;gap:20px}
.qa-vc h2{font-size:26px;font-weight:600}
.qa-vc-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:12px}
.qa-vc select{width:100%;box-sizing:border-box;height:48px;font-family:inherit;font-size:15px;padding:0 12px;border-radius:var(--qs-r-xs,12px);border:1px solid var(--qs-line-2,#c3d6df);background:#fff;color:var(--qs-ink,#1d2733)}
.qa-vc-fixed{display:flex;align-items:center;gap:8px;box-sizing:border-box;height:48px;font-size:15px;font-weight:500;padding:0 12px;border-radius:var(--qs-r-xs,12px);border:1px solid var(--qs-line,#dbe8ee);background:var(--qs-paper,#f6fbfd);color:var(--qs-ink,#1d2733)}
.qa-vc label{display:flex;flex-direction:column;gap:8px;font-size:13px;font-weight:500;color:var(--qs-ink-2,#5f666e)}
.qa-vc-types{display:flex;flex-wrap:wrap;gap:8px}
.qa-vc-type{font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:8px 16px;border-radius:var(--qs-r-xs,12px);border:1px solid var(--qs-line-2,#c3d6df);background:#fff;color:var(--qs-ink,#1d2733);text-align:start}
.qa-vc-type.on{border-color:var(--qs-brand,#049dc5);background:var(--qs-brand-soft,#e3f5fc);box-shadow:none}
.qa-vc-type b{font-size:15px;font-weight:600}.qa-vc-type span{font-size:13px;color:var(--qs-ink-2,#5f666e)}
.qa-vc-res{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:16px;animation:qa-tf-in .4s cubic-bezier(.16,1,.3,1) both}
.qa-vc-box{border-radius:var(--qs-r-xs,12px);background:var(--qs-paper,#f6fbfd);padding:16px;display:flex;flex-direction:column;gap:8px}
.qa-vc-kv{display:flex;justify-content:space-between;gap:12px;font-size:15px}.qa-vc-kv span:first-child{color:var(--qs-ink-2,#5f666e)}
.qa-vc-docs{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.qa-vc-docs li{display:flex;gap:8px;align-items:flex-start;font-size:15px;color:var(--qs-ink,#1d2733);line-height:1.6}
.qa-vc-docs li::before{content:'';flex-shrink:0;width:20px;height:20px;border-radius:50%;background:var(--qs-brand-soft,#e3f5fc) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23036f8c' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center/12px no-repeat;margin-top:2px}
.qa-vc-docs.opt li::before{background:#fff4dc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a5a00' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12h14M12 5v14'/%3E%3C/svg%3E") center/12px no-repeat}
.qa-vc-btns{display:flex;flex-wrap:wrap;gap:12px}
@keyframes qa-tf-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media (max-width:820px){.qa-vc{padding:24px 16px}.qa-vc h2{font-size:20px!important}.qa-vc-row,.qa-vc-res{display:flex!important;flex-direction:column}.qa-vc-btns>*{flex:1 1 100%;justify-content:center}}
@media (prefers-reduced-motion:reduce){.qa-vc-res{animation:none}}
`}</style>
      <div className="qa-vc">
        {embedded ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2>{en ? 'Visa checker' : 'فاحص التأشيرة'}</h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--qs-ink-2,#5f666e)' }}>{en ? 'Choose where you are going and see the price, processing time and the documents to prepare.' : 'اختر وجهتك واعرف فوراً السعر ومدة الإصدار والمستندات المطلوبة.'}</p>
          </div>
        )}
        <div className="qa-vc-row">
          <label>{en ? 'Nationality' : 'الجنسية'}
            <span className="qa-vc-fixed"><img src="https://flagcdn.com/w80/iq.png" alt="" width="26" height="18" style={{ width: 26, height: 18, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--qs-line,#ececed)' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />{natName}</span>
          </label>
          <label>{en ? 'Destination' : 'الوجهة'}
            <select value={countryId} onChange={(e) => setCountryId(e.target.value)}>
              <option value="">{cards === null ? (en ? 'Loading…' : 'جارٍ التحميل…') : (en ? `Choose a country (${countries.length})` : `اختر الدولة (${countries.length} دولة)`)}</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{nm(c.ar, c.en)}</option>)}
            </select>
          </label>
        </div>

        {country && (
          <>
            {types.length > 1 && (
              <div className="qa-vc-types" role="radiogroup" aria-label={en ? 'Visa type' : 'نوع التأشيرة'}>
                {types.map((t) => (
                  <button key={t.id} type="button" role="radio" aria-checked={String(t.id) === cardId} className={'qa-vc-type' + (String(t.id) === cardId ? ' on' : '')} onClick={() => setCardId(String(t.id))}>
                    <b>{nm(t.visa_type_name_ar, t.visa_type_name_en)}</b>
                    <span>{formatPrice(t.adult_price, 'IQD', lang)}{workDaysLabel(t.issuing_time_days, lang) ? ' · ' + workDaysLabel(t.issuing_time_days, lang) : ''}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="qa-vc-res" key={cardId}>
              <div className="qa-vc-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {country.flag ? <img src={flagSrc(country.flag)} alt="" width="34" height="24" style={{ width: 34, height: 24, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--qs-line,#ececed)' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : null}
                  <b style={{ fontSize: 17, fontWeight: 600, color: 'var(--qs-ink,#1d2733)' }}>{nm(country.ar, country.en)}{detail ? ' — ' + nm(detail.visa_type_name_ar, detail.visa_type_name_en) : ''}</b>
                </div>
                {detail && (
                  <>
                    <div className="qa-vc-kv"><span>{en ? 'Adult' : 'سعر البالغ'}</span><b style={{ fontWeight: 600, color: 'var(--qs-ink,#1d2733)' }}>{formatPrice(detail.adult_price, 'IQD', lang)}</b></div>
                    {Number(detail.child_price) > 0 && <div className="qa-vc-kv"><span>{en ? 'Child' : 'سعر الطفل'}</span><b>{formatPrice(detail.child_price, 'IQD', lang)}</b></div>}
                    <div className="qa-vc-kv"><span>{en ? 'Processing' : 'مدة الإصدار'}</span><span>{workDaysLabel(detail.issuing_time_days, lang) || '—'}</span></div>
                    {detail.stay_duration ? <div className="qa-vc-kv"><span>{en ? 'Length of stay' : 'مدة الإقامة'}</span><span>{detail.stay_duration}</span></div> : null}
                    {detail.validity_before_travel ? <div className="qa-vc-kv"><span>{en ? 'Valid before travel' : 'صلاحية قبل السفر'}</span><span>{detail.validity_before_travel}</span></div> : null}
                  </>
                )}
                {iso && guideFor(iso) && <Link href={'/guide/' + iso} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--qs-brand-deep,#049dc5)', marginTop: 4 }}><Icon name="compass" size={16} />{en ? 'Travel guide for this country' : 'دليل السفر لهذه الدولة'}<Icon name={en ? 'chevron-right' : 'chevron-left'} size={16} /></Link>}
              </div>
              <div className="qa-vc-box" style={{ background: '#fff', border: '1px solid var(--qs-line,#dbe8ee)' }}>
                <b style={{ fontSize: 17, fontWeight: 600, color: 'var(--qs-ink,#1d2733)' }}>{en ? 'Documents to prepare' : 'المستندات المطلوبة'}</b>
                {loading && !detail ? <span style={{ color: 'var(--qs-ink-2,#5f666e)', fontSize: 15 }}>{en ? 'Loading…' : 'جارٍ التحميل…'}</span> : null}
                {detail && req.length === 0 && opt.length === 0 ? <span style={{ color: 'var(--qs-ink-2,#5f666e)', fontSize: 15 }}>{en ? 'Message us and we will tell you exactly what is needed.' : 'راسلنا ونخبرك بالمطلوب بالضبط.'}</span> : null}
                {req.length > 0 && <ul className="qa-vc-docs">{req.map((d) => <li key={d.id}>{nm(d.name_ar, d.name_en)}{audience(d.audience) ? <span style={{ color: 'var(--qs-ink-2,#5f666e)', fontSize: 13 }}> ({audience(d.audience)})</span> : null}</li>)}</ul>}
                {opt.length > 0 && (<><span style={{ fontSize: 13, color: '#8a5a00', fontWeight: 500, marginTop: 4 }}>{en ? 'If applicable' : 'عند الحاجة'}</span><ul className="qa-vc-docs opt">{opt.map((d) => <li key={d.id}>{nm(d.name_ar, d.name_en)}</li>)}</ul></>)}
              </div>
            </div>
            <div className="qa-vc-btns">
              <button type="button" className="qs-btn qs-btn-brand" onClick={ask}><Icon name="message-circle" size={18} strokeWidth={2} />{en ? 'Apply on WhatsApp' : 'قدّم عبر واتساب'}</button>
              <button type="button" className="qs-btn qs-btn-line" onClick={downloadPdf} disabled={!detail}><Icon name="file-text" size={18} strokeWidth={2} />{en ? 'Download checklist (PDF)' : 'تحميل القائمة PDF'}</button>
              {detail && <Link className="qs-btn qs-btn-line" href={'/visa/' + detail.id}>{en ? 'Full details' : 'التفاصيل الكاملة'}</Link>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
