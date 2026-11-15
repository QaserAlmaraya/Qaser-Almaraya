'use client';
import { useEffect, useId, useMemo, useRef } from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { WA_ICON } from '../WhatsAppButton';
import { imgProps } from '../../lib/img';
import { formatPrice, formatSignedPrice } from '../../lib/currency';
import { packageMessage, openWhatsApp } from '../../lib/whatsapp';
import { compareFacts, formatDay } from './compareData';
import { removeCompare } from './compareStore';

const DASH = '—';
const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

function Dash() {
  return <span className="qc-dash">{DASH}</span>;
}

function Items({ items, icon, tone, lang }) {
  if (!items.length) return <Dash />;
  const shown = items.slice(0, 8);
  const more = items.length - shown.length;
  return (
    <ul className={'qc-list qc-list-' + tone}>
      {shown.map((t, i) => (
        <li key={i}><Icon name={icon} size={14} strokeWidth={2.4} /><span>{t}</span></li>
      ))}
      {more > 0 ? <li className="qc-more">{lang === 'en' ? `+${more} more on the package page` : `+${more} أخرى في صفحة الباقة`}</li> : null}
    </ul>
  );
}

// The comparison itself: a dialog on desktop, a bottom sheet on phones.
export default function CompareView({ packages, lang = 'ar', onClose }) {
  const en = lang === 'en';
  const titleId = useId();
  const sheetRef = useRef(null);
  const closeRef = useRef(null);
  const closeFn = useRef(onClose);
  closeFn.current = onClose;

  const cols = useMemo(() => packages.map((p) => compareFacts(p, lang)), [packages, lang]);
  const n = cols.length;

  // Page scroll is locked and the keyboard stays inside the dialog while it is open.
  useEffect(() => {
    document.body.classList.add('qc-open');
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeFn.current(); return; }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const els = [...sheetRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      const at = document.activeElement;
      if (!sheetRef.current.contains(at)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.body.classList.remove('qc-open');
      document.removeEventListener('keydown', onKey, true);
    };
  }, []);

  const prices = cols.map((c) => c.price).filter((v) => v != null);
  const lowest = prices.length > 1 && new Set(prices).size > 1 ? Math.min(...prices) : null;

  const book = (c) => openWhatsApp(packageMessage({
    title: c.title,
    dest: c.destination,
    nights: c.duration,
    url: window.location.origin + '/packages/' + c.id,
  }, lang));

  // A row is listed only when at least one of the compared packages has it.
  const textRow = (key, label, pick) => {
    const vals = cols.map(pick);
    if (!vals.some(Boolean)) return null;
    const same = n > 1 && vals.every((v) => v === vals[0]);
    return { key, label, same, cells: vals.map((v) => (v ? <span className="qc-val">{v}</span> : <Dash />)) };
  };

  const rows = [
    prices.length ? {
      key: 'price',
      label: en ? 'Price per person' : 'السعر للفرد',
      cells: cols.map((c) => (c.price == null ? <Dash /> : (
        <span className={'qc-price' + (lowest != null && c.price === lowest ? ' low' : '')}>
          <small>{en ? 'Starting from' : 'يبدأ من'}</small>
          <b>{formatPrice(c.price, 'IQD', lang)}</b>
          {lowest != null && c.price === lowest ? <em>{en ? 'Lowest price' : 'الأقل سعراً'}</em> : null}
        </span>
      ))),
    } : null,
    textRow('duration', en ? 'Duration' : 'المدة', (c) => c.duration),
    textRow('dest', en ? 'Destination' : 'الوجهة', (c) => c.destination),
    textRow('type', en ? 'Trip type' : 'نوع الرحلة', (c) => c.type),
    textRow('departs', en ? 'Departures' : 'المغادرة', (c) => c.departs),
    cols.some((c) => c.dates.length) ? {
      key: 'dates',
      label: en ? 'Next dates' : 'أقرب المواعيد',
      cells: cols.map((c) => (c.dates.length ? (
        <ul className="qc-dates">
          {c.dates.slice(0, 3).map((d) => <li key={d}>{formatDay(d, lang)}</li>)}
          {c.dates.length > 3 ? <li className="qc-more">{en ? `+${c.dates.length - 3} more dates` : `+${c.dates.length - 3} مواعيد أخرى`}</li> : null}
        </ul>
      ) : <Dash />)),
    } : null,
    cols.some((c) => c.hotels.length) ? {
      key: 'hotels',
      label: en ? 'Hotels' : 'الفنادق',
      cells: cols.map((c) => (c.hotels.length ? (
        <ul className="qc-hotels">
          {c.hotels.map((h, i) => (
            <li key={i}>
              <span className="qc-hotel-n">{h.name}</span>
              {h.stars ? (
                <span className="qc-stars" role="img" aria-label={en ? `${h.stars} stars` : `${h.stars} نجوم`}>
                  {Array.from({ length: h.stars }).map((_, s) => <Icon key={s} name="star" size={12} />)}
                </span>
              ) : null}
              {h.meals ? <span className="qc-hotel-m"><Icon name="utensils" size={12} />{h.meals}</span> : null}
              {h.extra ? <span className="qc-hotel-x">{formatSignedPrice(h.extra, 'IQD', lang)}</span> : null}
            </li>
          ))}
        </ul>
      ) : <Dash />)),
    } : null,
    cols.some((c) => c.flights.length) ? {
      key: 'flights',
      label: en ? 'Flights' : 'الطيران',
      cells: cols.map((c) => (c.flights.length ? (
        <ul className="qc-plain">{c.flights.map((f, i) => <li key={i}>{f}</li>)}</ul>
      ) : <Dash />)),
    } : null,
    cols.some((c) => c.includes.length) ? {
      key: 'inc',
      label: en ? 'Price includes' : 'السعر يشمل',
      cells: cols.map((c) => <Items items={c.includes} icon="check" tone="yes" lang={lang} />),
    } : null,
    cols.some((c) => c.excludes.length) ? {
      key: 'exc',
      label: en ? 'Not included' : 'السعر لا يشمل',
      cells: cols.map((c) => <Items items={c.excludes} icon="x" tone="no" lang={lang} />),
    } : null,
  ].filter(Boolean);

  const countLabel = en
    ? `${n} ${n === 1 ? 'package' : 'packages'}`
    : n === 1 ? 'باقة واحدة' : n === 2 ? 'باقتان' : `${n} باقات`;

  return (
    <div className="qc-overlay" data-no-i18n="" dir={en ? 'ltr' : 'rtl'} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={sheetRef} className="qc-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} style={{ '--qc-n': n }} data-n={n}>
        <header className="qc-head">
          <div>
            <h2 id={titleId} className="qc-title">{en ? 'Compare packages' : 'مقارنة الباقات'}</h2>
            <span className="qc-sub">{countLabel}{n === 1 ? (en ? ' · add another one from the list to compare' : ' · أضف باقة أخرى من القائمة للمقارنة') : ''}</span>
          </div>
          <button type="button" ref={closeRef} className="qc-close" onClick={onClose} aria-label={en ? 'Close comparison' : 'إغلاق المقارنة'}>
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="qc-scroll">
          <div className="qc-grid" role="table" aria-labelledby={titleId}>
            <div className="qc-row qc-row-head" role="row">
              <span className="qc-lab qc-corner" role="columnheader"><span>{n > 2 ? (en ? 'Swipe sideways to see all' : 'اسحب جانباً لرؤية الكل') : ''}</span></span>
              {cols.map((c) => (
                <div key={c.id} className="qc-cell qc-col-head" role="columnheader">
                  <div className="qc-photo">
                    {c.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img {...imgProps(c.image, '(max-width: 820px) 46vw, 280px', [384, 640])} alt="" loading="lazy" decoding="async" />
                    ) : <Icon name="image" size={22} />}
                    <button type="button" className="qc-remove" onClick={() => removeCompare(c.id)} aria-label={(en ? 'Remove from comparison: ' : 'إزالة من المقارنة: ') + c.title}>
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                  <span className="qc-name">{c.title || DASH}</span>
                </div>
              ))}
            </div>

            {rows.map((r) => (
              <div key={r.key} className={'qc-row' + (r.same ? ' same' : '')} role="row">
                <span className="qc-lab" role="rowheader"><span>{r.label}</span></span>
                {r.cells.map((cell, i) => <div key={cols[i].id} className="qc-cell" role="cell">{cell}</div>)}
              </div>
            ))}

            <div className="qc-row qc-row-foot" role="row">
              <span className="qc-lab qc-lab-empty" role="rowheader"><span className="qc-sr">{en ? 'Next step' : 'الخطوة التالية'}</span></span>
              {cols.map((c) => (
                <div key={c.id} className="qc-cell qc-acts" role="cell">
                  <button type="button" className="qa-amber qc-book" onClick={() => book(c)} aria-label={(en ? 'Book on WhatsApp: ' : 'احجز عبر واتساب: ') + c.title}>
                    {WA_ICON}<span>{en ? 'Book on WhatsApp' : 'احجز عبر واتساب'}</span>
                  </button>
                  <Link href={'/packages/' + c.id} className="qc-open-link" onClick={onClose} aria-label={(en ? 'View package: ' : 'عرض الباقة: ') + c.title}>
                    {en ? 'View package' : 'عرض الباقة'}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
