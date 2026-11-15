'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Icon from '../Icon';
import { WA_ICON } from '../WhatsAppButton';
import { formatPrice, formatSignedPrice } from '../../lib/currency';
import { packageMessage, openWhatsApp } from '../../lib/whatsapp';
import { destinationLabel, nightsLabel } from '../../lib/destinations';
import { TRAVELLER_TYPES } from '../../lib/packagePricing';
import { DEFAULT_COUNTS, calcOptions, calcQuote } from '../../lib/packageCalc';

// ─────────────────────────────────────────────────────────────────────────
// «احسب السعر» — a quick price calculator opened from a package card, so the
// customer can price a trip without entering the package page.
//
//   import PriceCalcHost, { openPriceCalc } from '.../components/calc/PriceCalc';
//   <PackageCard ... onCalc={() => openPriceCalc(pkg)} />
//   <PriceCalcHost lang={lang} />            // once per page
//
// Numbers: lib/packageCalc.js → computeTotals() in lib/packagePricing.js, the
// same call the package page makes, on the same public package object. IQD
// only. Styles: app/qs-calc.css (prefix qk-).
// ─────────────────────────────────────────────────────────────────────────

const MAX_PER_TYPE = 30;
const subscribers = new Set();

/** Open the calculator for a (public) package object. */
export function openPriceCalc(pkg) {
  subscribers.forEach((fn) => fn(pkg || null));
}

const STR = {
  ar: {
    calc: 'احسب السعر', close: 'إغلاق', hotel: 'الفندق', flight: 'الرحلة', date: 'تاريخ الانطلاق',
    travellers: 'المسافرون', total: 'الإجمالي الكلي', included: 'مشمول',
    book: 'احجز عبر واتساب', details: 'تفاصيل الباقة', onRequest: 'السعر عند الطلب',
    onRequestSub: 'راسلنا على واتساب ونرسل لك سعر هذه الباقة.',
    noAdults: 'أضف بالغاً واحداً على الأقل لإكمال الحجز — لا يمكن حجز الأطفال والرضّع بدون بالغ.',
    more: 'زيادة', less: 'إنقاص', totalMsg: 'الإجمالي الكلي: ',
  },
  en: {
    calc: 'Price calculator', close: 'Close', hotel: 'Hotel', flight: 'Flight', date: 'Departure date',
    travellers: 'Travellers', total: 'Grand total', included: 'Included',
    book: 'Book on WhatsApp', details: 'Package details', onRequest: 'Price on request',
    onRequestSub: 'Message us on WhatsApp and we will send you the price of this package.',
    noAdults: 'Add at least one adult to continue — children and infants cannot travel on their own.',
    more: 'More', less: 'Fewer', totalMsg: 'Grand total: ',
  },
};

// Short tween of the total when it changes. Steps land on whole thousands so
// every in-between value still reads like a price. No motion when the visitor
// asked for less of it.
function useTween(target, ms = 380) {
  const [shown, setShown] = useState(target);
  const at = useRef(target);
  useEffect(() => {
    const from = at.current;
    if (from === target) return undefined;
    const still = typeof window === 'undefined' || !window.requestAnimationFrame
      || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (still) { at.current = target; setShown(target); return undefined; }
    let raf = 0;
    let t0 = 0;
    const step = (now) => {
      if (!t0) t0 = now;
      const k = Math.min(1, (now - t0) / ms);
      const eased = 1 - Math.pow(1 - k, 3);
      const cur = from + (target - from) * eased;
      at.current = k === 1 ? target : cur;
      setShown(k === 1 ? target : Math.round(cur / 1000) * 1000);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return shown;
}

function fmtDate(d, lang) {
  const iso = String((d && d.date) || d || '');
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return iso;
  return t.toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-IQ-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Options({ legend, name, items, value, onChange, lang, label, note, diff }) {
  return (
    <fieldset className="qk-sec qk-opts">
      <legend className="qk-label">{legend}</legend>
      {items.map((it, i) => {
        const d = Number(diff(it)) || 0;
        const n = note ? note(it) : '';
        return (
          <label key={i} className={'qk-opt' + (i === value ? ' on' : '')}>
            <input type="radio" name={name} checked={i === value} onChange={() => onChange(i)} />
            <span className="qk-dot" aria-hidden="true" />
            <span className="qk-opt-name">
              {label(it)}
              {n ? <small>{n}</small> : null}
            </span>
            <span className={'qk-opt-diff' + (d ? ' up' : '')} dir={lang === 'en' ? 'ltr' : 'rtl'}>{formatSignedPrice(d, 'IQD', lang)}</span>
          </label>
        );
      })}
    </fieldset>
  );
}

function Panel({ pkg, lang, onClose }) {
  const en = lang === 'en';
  const s = en ? STR.en : STR.ar;
  const nm = (ar, enText) => (en && enText ? enText : ar);
  const price = (v) => formatPrice(v, 'IQD', lang); // IQD only, never the visitor's USD toggle
  const titleId = useId();
  const groupId = useId();
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  const [hotelIdx, setHotelIdx] = useState(0);
  const [flightIdx, setFlightIdx] = useState(0);
  const [dateIdx, setDateIdx] = useState(0);
  const [counts, setCounts] = useState(DEFAULT_COUNTS);

  const { hotels, flights, dates } = useMemo(() => calcOptions(pkg), [pkg]);
  const quote = useMemo(() => calcQuote(pkg, { hotelIdx, flightIdx, dateIdx, counts }), [pkg, hotelIdx, flightIdx, dateIdx, counts]);
  const shownTotal = useTween(quote.total);
  const adults = quote.counts.adult + quote.counts.single;
  const noAdults = quote.priceable && adults <= 0;

  // Modal behaviour: lock the page behind, Esc closes, Tab stays inside,
  // focus goes back to the button that opened the panel.
  useEffect(() => {
    const opener = document.activeElement;
    const body = document.body;
    const root = document.documentElement; // the page scrolls on <html>, so both are locked
    const prev = body.style.overflow;
    const prevRoot = [root.style.overflowY, root.style.scrollbarGutter];
    body.style.overflow = 'hidden';
    root.style.scrollbarGutter = 'stable'; // keep the scrollbar's width so the page behind does not jump
    root.style.overflowY = 'hidden';
    body.classList.add('qk-open', 'qa-drawer-open'); // qa-drawer-open: the site's own "hide the phone bar and chat bubble" switch
    if (closeRef.current) closeRef.current.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = [...panelRef.current.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      const inside = panelRef.current.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (!inside || document.activeElement === last)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      body.style.overflow = prev;
      root.style.overflowY = prevRoot[0];
      root.style.scrollbarGutter = prevRoot[1];
      body.classList.remove('qk-open', 'qa-drawer-open');
      try { if (opener && opener.focus) opener.focus({ preventScroll: true }); } catch { /* opener gone */ }
    };
  }, [onClose]);

  const title = nm(pkg.title_ar, pkg.title_en) || '';
  const sub = [destinationLabel(pkg, lang), nightsLabel(pkg, lang)].filter((x) => x && x !== title).join(' · ');
  const hotelName = (h) => nm(h.nameAr, h.nameEn) || '';
  const hotelNote = (h) => ((h.notesAr || h.notesEn) ? nm(h.notesAr, h.notesEn) : '');
  const typeLabel = (t) => (en ? t.en : t.ar);
  const travellerSummary = () => TRAVELLER_TYPES
    .map((t) => (quote.counts[t.key] > 0 ? quote.counts[t.key] + ' ' + typeLabel(t) : null))
    .filter(Boolean).join(en ? ', ' : '، ');

  // Same helper and number as the package page's WhatsApp button, plus the total.
  const waMessage = () => {
    const h = quote.hotel;
    const f = quote.flight;
    const ok = quote.priceable;
    const lines = packageMessage({
      title,
      dest: destinationLabel(pkg, lang),
      nights: nightsLabel(pkg, lang),
      hotel: h ? hotelName(h) + (hotelNote(h) ? ' (' + hotelNote(h) + ')' : '') : '',
      flight: f ? nm(f.nameAr, f.nameEn) : '',
      travellers: ok ? travellerSummary() : '',
      date: quote.date ? String(quote.date.date || '') : '',
      url: window.location.origin + '/packages/' + pkg.id,
    }, lang).split('\n');
    if (ok && quote.total > 0) lines.splice(lines.length - 1, 0, s.totalMsg + price(quote.total));
    return lines.join('\n');
  };

  const bump = (key, by) => setCounts((c) => ({ ...c, [key]: Math.max(0, Math.min(MAX_PER_TYPE, (quote.counts[key] || 0) + by)) }));

  return (
    <div className="qk-root" dir={en ? 'ltr' : 'rtl'} data-no-i18n="">
      <div className="qk-scrim" onClick={onClose} />
      <div className="qk-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef}>
        <div className="qk-head">
          <div className="qk-head-copy">
            <span className="qk-eyebrow"><Icon name="banknote" size={15} />{s.calc}</span>
            <div className="qk-title" id={titleId} role="heading" aria-level="2">{title}</div>
            {sub ? <span className="qk-sub">{sub}</span> : null}
          </div>
          <button type="button" className="qk-x" onClick={onClose} aria-label={s.close} ref={closeRef}><Icon name="x" size={18} /></button>
        </div>

        {quote.priceable ? (
          <div className="qk-body">
            <div className="qk-sec" role="group" aria-label={s.travellers}>
              <span className="qk-label">{s.travellers}</span>
              {quote.types.map((t) => {
                const c = quote.counts[t.key];
                const hint = en ? t.hintEn : t.hintAr;
                return (
                  <div key={t.key} className="qk-row">
                    <span className="qk-row-name">
                      <span>{typeLabel(t)}{hint ? <small> ({hint})</small> : null}</span>
                      <span className="qk-row-unit">{price(quote.units[t.key])}</span>
                    </span>
                    <span className="qk-step">
                      <button type="button" disabled={c <= 0} onClick={() => bump(t.key, -1)} aria-label={s.less + ' — ' + typeLabel(t)}>−</button>
                      <b aria-live="polite">{c}</b>
                      <button type="button" disabled={c >= MAX_PER_TYPE} onClick={() => bump(t.key, 1)} aria-label={s.more + ' — ' + typeLabel(t)}>+</button>
                    </span>
                  </div>
                );
              })}
              {noAdults ? <span className="qk-warn" role="alert">{s.noAdults}</span> : null}
            </div>

            {hotels.length > 1 ? (
              <Options legend={s.hotel} name={groupId + 'h'} items={hotels} value={hotelIdx} onChange={setHotelIdx} lang={lang}
                label={hotelName} note={hotelNote} diff={(h) => (h.extras && h.extras.adult != null ? h.extras.adult : h.diff)} />
            ) : hotels[0] && hotelName(hotels[0]) ? (
              <div className="qk-sec qk-fact"><span className="qk-label">{s.hotel}</span><span>{hotelName(hotels[0])}{hotelNote(hotels[0]) ? <small>{hotelNote(hotels[0])}</small> : null}</span></div>
            ) : null}

            {flights.length > 1 ? (
              <Options legend={s.flight} name={groupId + 'f'} items={flights} value={flightIdx} onChange={setFlightIdx} lang={lang}
                label={(f) => nm(f.nameAr, f.nameEn) || ''} diff={(f) => f.diff} />
            ) : null}

            {dates.length > 0 ? (
              <div className="qk-sec" role="group" aria-label={s.date}>
                <span className="qk-label">{s.date}</span>
                <div className="qk-dates">
                  {dates.map((d, i) => (
                    <button key={i} type="button" className={'qk-date' + (i === dateIdx ? ' on' : '')} aria-pressed={i === dateIdx} onClick={() => setDateIdx(i)}>
                      <span dir="ltr">{fmtDate(d, lang)}</span>
                      {d && d.adjust ? <small className={d.adjust > 0 ? 'up' : 'down'}>{formatSignedPrice(d.adjust, 'IQD', lang)}</small> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {quote.lines.length > 0 ? (
              <ul className="qk-lines">
                {quote.lines.map((l) => (
                  <li key={l.type.key}>
                    <span>{l.count} {typeLabel(l.type)} × {price(l.unit)}</span>
                    <span>{price(l.subtotal)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="qk-body qk-ask">
            <span className="qk-ask-h">{s.onRequest}</span>
            <span className="qk-ask-p">{s.onRequestSub}</span>
          </div>
        )}

        <div className="qk-foot">
          {quote.priceable ? (
            <div className="qk-total">
              <span>{s.total}</span>
              <b aria-hidden="true">{price(shownTotal)}</b>
              <span className="qk-sr" role="status">{s.total} {price(quote.total)}</span>
            </div>
          ) : null}
          <div className="qk-acts">
            <button type="button" className="qk-wa" disabled={noAdults} onClick={() => openWhatsApp(waMessage())}>
              {WA_ICON}<span>{s.book}</span>
            </button>
            <Link href={'/packages/' + pkg.id} className="qk-more" onClick={onClose}>{s.details}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mount once on a page; openPriceCalc(pkg) shows the panel. */
export default function PriceCalcHost({ lang = 'ar' }) {
  const [pkg, setPkg] = useState(null);
  useEffect(() => {
    subscribers.add(setPkg);
    return () => { subscribers.delete(setPkg); };
  }, []);
  const close = useMemo(() => () => setPkg(null), []);
  if (!pkg || typeof document === 'undefined') return null;
  return createPortal(<Panel key={pkg.id} pkg={pkg} lang={lang} onClose={close} />, document.body);
}
