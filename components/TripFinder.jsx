'use client';
import { imgProps } from '../lib/img';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { loadPackages, upcomingDates } from '../lib/publicPackages';
import { BUDGETS } from '../lib/budgets';
import { CATS } from '../lib/packagesData';
import { formatPrice } from '../lib/currency';
import { nightsLabel, destinationLabel } from '../lib/destinations';
import { openWhatsApp } from '../lib/whatsapp';
import Icon from './Icon';

// Homepage "Where can I go on my budget?": the customer picks a budget, a
// month and a trip type, and gets the 3 closest packages, with one button
// that sends the picks to the company WhatsApp (784 line).

const MONTHS_AR = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_EN_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function nextMonths(n = 6) {
  const d = new Date();
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = new Date(d.getFullYear(), d.getMonth() + i, 1);
    out.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'));
  }
  return out;
}

function Chip({ on, onClick, children }) {
  return <button type="button" className={'qa-tf-chip' + (on ? ' on' : '')} aria-pressed={on} onClick={onClick}>{children}</button>;
}

function score(p, { budget, month, cat }) {
  const b = BUDGETS.find((x) => x.id === budget);
  const price = Number(p.price) || 0;
  const dates = upcomingDates(p);
  const fit = { budget: !b || (price >= b.min && price < b.max), month: month === 'any' || dates.some((d) => d.startsWith(month)), cat: cat === 'any' || p.cat === cat };
  let s = 0;
  if (b) s += fit.budget ? 30 : -Math.min(20, Math.abs(price - (price < b.min ? b.min : b.max)) / 100000);
  if (month !== 'any') s += fit.month ? 30 : dates.length === 0 ? 8 : 0;
  if (cat !== 'any') s += fit.cat ? 30 : 0;
  return { p, s, exact: fit.budget && fit.month && fit.cat, price };
}

// `embedded`: the page supplies the heading (a folded row on the homepage),
// so the tool renders without its own title and card frame.
export default function TripFinder({ lang = 'ar', embedded = false }) {
  const en = lang === 'en';
  const nm = (ar, enText) => (en && enText ? enText : ar);
  const [list, setList] = useState(null);
  const [budget, setBudget] = useState('any');
  const [month, setMonth] = useState('any');
  const [cat, setCat] = useState('any');
  const [asked, setAsked] = useState(false);
  const months = useMemo(() => nextMonths(6), []);

  useEffect(() => {
    let alive = true;
    loadPackages().then((l) => { if (alive) setList(l); });
    return () => { alive = false; };
  }, []);

  const cats = useMemo(() => CATS.filter((c) => (list || []).some((p) => p.cat === c.id)), [list]);
  const picks = useMemo(() => {
    if (!list) return [];
    return list
      .filter((p) => Number(p.price) > 0)
      .map((p) => score(p, { budget, month, cat }))
      .sort((a, b) => b.s - a.s || a.price - b.price)
      .slice(0, 3);
  }, [list, budget, month, cat]);

  if (list && list.length === 0) return null;
  const show = asked || budget !== 'any' || month !== 'any' || cat !== 'any';

  const monthName = (ym, full) => { const [y, m] = ym.split('-').map(Number); return (en ? (full ? MONTHS_EN_FULL : MONTHS_EN) : MONTHS_AR)[m - 1] + (full ? ' ' + y : ''); };
  const budgetName = (id) => { const b = BUDGETS.find((x) => x.id === id); return b ? nm(b.ar, b.en) : en ? 'Any budget' : 'أي ميزانية'; };
  const catName = (id) => { const c = CATS.find((x) => x.id === id); return c ? nm(c.ar, c.en) : en ? 'Any type' : 'أي نوع'; };

  function sendWhatsApp() {
    const origin = window.location.origin;
    const lines = [
      en ? 'Hello, I am looking for a trip:' : 'مرحباً، أبحث عن رحلة:',
      (en ? 'Budget per person: ' : 'الميزانية للشخص: ') + budgetName(budget),
      (en ? 'Month: ' : 'الشهر: ') + (month === 'any' ? (en ? 'Flexible' : 'مرن') : monthName(month, true)),
      cat !== 'any' ? (en ? 'Trip type: ' : 'نوع الرحلة: ') + catName(cat) : null,
    ].filter(Boolean);
    if (picks.length) {
      lines.push('', en ? 'Suggestions from the website:' : 'اقتراحات الموقع:');
      picks.forEach(({ p }, i) => lines.push((i + 1) + ') ' + nm(p.title_ar, p.title_en) + ' — ' + formatPrice(p.price, 'IQD', lang) + '\n' + origin + '/packages/' + p.id));
    }
    openWhatsApp(lines.join('\n'));
  }

  return (
    <section className={embedded ? 'qa-tf-sec qa-tf-embedded' : 'qa-sec qa-tf-sec'} data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <style>{`
.qa-tf{position:relative;border-radius:var(--qs-r,20px);background:#fff;border:1px solid var(--qs-line,#dbe8ee);color:var(--qs-ink,#1d2733);padding:32px;display:flex;flex-direction:column;gap:24px}
.qa-tf h2{font-size:26px;font-weight:600}
.qa-tf-row{display:flex;flex-direction:column;gap:8px}
.qa-tf-row>b{font-size:13px;color:var(--qs-ink-2,#5f666e);font-weight:600}
.qa-tf-chips{display:flex;flex-wrap:wrap;gap:8px}
.qa-tf-chip{font-family:inherit;font-size:15px;font-weight:500;min-height:40px;padding:0 16px;border-radius:999px;border:1px solid var(--qs-line-2,#c3d6df);background:#fff;color:var(--qs-ink,#1d2733);cursor:pointer;transition:background .15s,transform .15s,border-color .15s}
.qa-tf-chip:hover{border-color:var(--qs-ink,#1d2733)}
.qa-tf-chip.on{background:var(--qs-brand,#049dc5);border-color:var(--qs-brand,#049dc5);color:#fff}
.qa-tf-res{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.qa-tf-card{display:flex;gap:12px;align-items:stretch;background:#fff;border:1px solid var(--qs-line,#dbe8ee);color:var(--qs-ink,#1d2733);border-radius:var(--qs-r-xs,12px);overflow:hidden;animation:qa-tf-in .45s cubic-bezier(.16,1,.3,1) both;transition:border-color .2s}
.qa-tf-card:hover{color:var(--qs-ink,#1d2733);border-color:var(--qs-line-2,#c3d6df)}
.qa-tf-card img{width:96px;flex-shrink:0;object-fit:cover;background:var(--qs-brand-soft,#e4f5fb)}
.qa-tf-card:nth-child(2){animation-delay:.07s}.qa-tf-card:nth-child(3){animation-delay:.14s}
@keyframes qa-tf-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.qa-tf-tag{align-self:flex-start;font-size:13px;font-weight:600;border-radius:999px;padding:0 8px;line-height:1.7}
.qa-tf-acts{display:flex;flex-wrap:wrap;gap:12px}
@media (max-width:820px){.qa-tf{padding:24px 16px;gap:20px}.qa-tf h2{font-size:20px!important}.qa-tf-chips{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding-bottom:4px}.qa-tf-chips::-webkit-scrollbar{display:none}.qa-tf-chip{white-space:nowrap;flex-shrink:0}.qa-tf-res{display:flex!important;flex-direction:column}.qa-tf-acts>*{flex:1 1 100%}}
@media (prefers-reduced-motion:reduce){.qa-tf-card{animation:none}}
`}</style>
      <div className="qa-tf">
        {embedded ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            <h2>{en ? 'Where can I go on my budget?' : 'إلى أين أسافر بميزانيتي؟'}</h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--qs-ink-2,#5f666e)' }}>{en ? 'Pick what suits you and we suggest the closest trips.' : 'اختر ما يناسبك، ونقترح عليك أقرب الرحلات.'}</p>
          </div>
        )}

        <div className="qa-tf-row">
          <b>{en ? '1. Budget per person' : '١. ميزانيتك للشخص'}</b>
          <div className="qa-tf-chips">
            <Chip on={budget === 'any'} onClick={() => setBudget('any')}>{en ? 'Any' : 'أي ميزانية'}</Chip>
            {BUDGETS.map((b) => <Chip key={b.id} on={budget === b.id} onClick={() => setBudget(b.id)}>{nm(b.ar, b.en)}</Chip>)}
          </div>
        </div>
        <div className="qa-tf-row">
          <b>{en ? '2. When?' : '٢. متى تسافر؟'}</b>
          <div className="qa-tf-chips">
            <Chip on={month === 'any'} onClick={() => setMonth('any')}>{en ? 'Flexible' : 'أي وقت'}</Chip>
            {months.map((m) => <Chip key={m} on={month === m} onClick={() => setMonth(m)}>{monthName(m, false)}</Chip>)}
          </div>
        </div>
        {cats.length > 1 && <div className="qa-tf-row">
          <b>{en ? '3. Trip type' : '٣. نوع الرحلة'}</b>
          <div className="qa-tf-chips">
            <Chip on={cat === 'any'} onClick={() => setCat('any')}>{en ? 'Any' : 'أي نوع'}</Chip>
            {cats.map((c) => <Chip key={c.id} on={cat === c.id} onClick={() => setCat(c.id)}>{nm(c.ar, c.en)}</Chip>)}
          </div>
        </div>}

        {!show ? (
          <button type="button" className="qs-btn qs-btn-brand" style={{ alignSelf: 'flex-start' }} onClick={() => setAsked(true)}>{en ? 'Suggest trips' : 'اقترح لي'}</button>
        ) : (
          <>
            <div className="qa-tf-res" key={budget + month + cat}>
              {list === null
                ? [0, 1, 2].map((i) => <div key={i} className="qa-tf-card" style={{ minHeight: 96, opacity: 0.5 }} />)
                : picks.map(({ p, exact }) => (
                  <Link key={p.id} href={'/packages/' + p.id} className="qa-tf-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image_url ? <img {...imgProps(p.image_url, '96px', [384])} alt="" loading="lazy" decoding="async" /> : <span style={{ width: 96, background: 'var(--qs-brand-soft,#e4f5fb)' }} />}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 0', paddingInlineEnd: 12, minWidth: 0, flex: 1 }}>
                      <span className="qa-tf-tag" style={exact ? { background: 'var(--qs-brand-soft,#e3f5fc)', color: '#036f8c' } : { background: '#fff4dc', color: '#8a5a00' }}>{exact ? (en ? 'Matches your choice' : 'يطابق اختيارك') : (en ? 'Closest option' : 'أقرب خيار')}</span>
                      <b style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{nm(p.title_ar, p.title_en)}</b>
                      <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)' }}>{[destinationLabel(p, lang), nightsLabel(p, lang)].filter(Boolean).join(' · ')}</span>
                      <span style={{ marginTop: 'auto', fontSize: 15, fontWeight: 600, color: 'var(--qs-ink,#1d2733)' }}>{formatPrice(p.price, 'IQD', lang)}</span>
                    </div>
                  </Link>
                ))}
            </div>
            <div className="qa-tf-acts">
              <button type="button" className="qs-btn qs-btn-brand" onClick={sendWhatsApp}>
                <Icon name="message-circle" size={18} strokeWidth={2} />
                {en ? 'Send these picks on WhatsApp' : 'أرسل الاقتراحات على واتساب'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
