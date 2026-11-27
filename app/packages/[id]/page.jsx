'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '../../../components/SiteHeader';
import SiteFooter from '../../../components/SiteFooter';
import MascotLoader from '../../../components/MascotLoader';
import Icon from '../../../components/Icon';
import { useLangToggle } from '../../../lib/i18n';
import { T, catLabel } from '../../../lib/packagesData';
import { formatPrice, formatSignedPrice } from '../../../lib/currency';
import { printDoc, copyText } from '../../../lib/printDoc';
import WhatsAppButton, { WA_ICON } from '../../../components/WhatsAppButton';
import { APPLY_FLOW_ENABLED, packageMessage, openWhatsApp } from '../../../lib/whatsapp';
import CtaButton from '../../../components/CtaButton';
import { Accordion, AccordionItem } from '../../../components/routes/Accordion';
import { guideFor } from '../../../lib/destinationGuide';
import { buildPackageVoucherHtml, stripFlags } from '../../../lib/packagePdf';
import UrgencyPanel from '../../../components/UrgencyPanel';
import { TRAVELLER_TYPES, computeTotals, unitPrice, durationLabel, tripDays, returnDate } from '../../../lib/packagePricing';
import { useProviderReveal } from '../../../lib/useProviderReveal';
import WorldClocks, { destinationTz } from '../../../components/WorldClocks';
import { COUNTRY_GEO } from '../../../lib/geoData';
import { nightsLabel, destinationLabel, packageCountries } from '../../../lib/destinations';
import { GuideCompact } from '../../../components/DestinationGuide';
import { nextDeparture } from '../../../lib/packageUrgency';
import { imgProps } from '../../../lib/img';

const optStyle = (on) => ({
  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 'var(--tw-radius-sm,10px)',
  border: `1px solid ${on ? 'var(--qs-brand,#049dc5)' : 'var(--qs-line,#ececed)'}`, cursor: 'pointer', background: on ? 'var(--qs-brand-soft,#eaf8fd)' : 'var(--qd-surface,#fff)',
});

// "12 Dec 2026" / "12 كانون الأول 2026" for the departure–return line.
function fmtTripDate(iso, lang) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-IQ-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PackageDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { lang } = useLangToggle();
  const t = T[lang] || T.ar;
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);

  const [pkg, setPkg] = useState(null);
  const [error, setError] = useState('');
  const [hotelIdx, setHotelIdx] = useState(0);
  const [flightIdx, setFlightIdx] = useState(0);
  const [counts, setCounts] = useState({ adult: 2, single: 0, childBed: 0, childNoBed: 0, infant: 0 });
  const [dateIdx, setDateIdx] = useState(0);
  const adults = counts.adult + counts.single; // kept for the WhatsApp/booking params below
  const children = counts.childBed + counts.childNoBed + counts.infant;
  // Every room type may be taken down to 0, but a booking still needs an adult.
  const noAdults = adults <= 0;
  const noAdultsMsg = lang === 'en'
    ? 'Add at least one adult to continue — children and infants cannot travel on their own.'
    : 'أضف بالغاً واحداً على الأقل لإكمال الحجز — لا يمكن حجز الأطفال والرضّع بدون بالغ.';
  const [toast, setToast] = useState('');
  // Phone-only booking bar: shown while the price card's WhatsApp button is off screen.
  const ctaRef = useRef(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [pkg]);
  // Staff quote builder (only after Alt + Q with a logged-in staff session)
  const { providers: staffHints, revealed: staffMode } = useProviderReveal('/api/staff/package-hints');
  const [quote, setQuote] = useState({ customer: '', discountType: 'amount', discount: '', validUntil: '', note: '' });

  useEffect(() => {
    fetch(`/api/packages/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError('تعذّر تحميل بيانات الباقة');
        else setPkg(data);
      })
      .catch(() => setError('تعذّر تحميل بيانات الباقة'));
  }, [id]);

  const hotels = pkg?.hotels || [];
  const flights = pkg?.flights || [];
  const days = pkg?.days || [];
  const includes = (lang === 'en' && pkg?.includes_en?.length ? pkg.includes_en : pkg?.includes_ar) || [];
  const excludes = (lang === 'en' && pkg?.excludes_en?.length ? pkg.excludes_en : pkg?.excludes_ar) || [];
  const generalNotes = String((lang === 'en' && pkg?.general_notes_en) ? pkg.general_notes_en : (pkg?.general_notes_ar || pkg?.general_notes_en || '')).split('\n').map((l) => l.trim()).filter(Boolean);

  const selectedHotelCoords = useMemo(() => {
    const h = hotels[hotelIdx];
    if (!h || h.lat === undefined || h.lat === '' || h.lng === undefined || h.lng === '') return null;
    const lat = Number(h.lat);
    const lng = Number(h.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  }, [hotels, hotelIdx]);
  const availableDates = Array.isArray(pkg?.available_dates) ? pkg.available_dates : [];
  const selectedDate = availableDates[dateIdx] || null;
  const totals = useMemo(
    () => computeTotals(pkg || {}, counts, hotels[hotelIdx], flights[flightIdx], selectedDate),
    [pkg, counts, hotels, hotelIdx, flights, flightIdx, selectedDate]
  );
  const upgrade = totals.extra;
  const grandTotal = totals.total;
  const totalPerAdult = unitPrice(pkg || {}, TRAVELLER_TYPES[0], upgrade);

  function goBook() {
    if (noAdults) { flashToast(noAdultsMsg); return; }
    const params = new URLSearchParams({
      hotel: String(hotelIdx),
      flight: String(flightIdx),
      adults: String(adults),
      children: String(children),
    });
    router.push(`/packages/${id}/book?${params.toString()}`);
  }

  function flashToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  }

  function packageSummaryLines() {
    const en = lang === 'en';
    const lines = [
      nm(pkg.title_ar, pkg.title_en) + ' — ' + destinationLabel(pkg, lang),
      (en ? 'Duration: ' : 'المدة: ') + nightsLabel(pkg, lang),
      (en ? 'Departures: ' : 'الانطلاق: ') + nm(pkg.departs_ar, pkg.departs_en),
    ];
    if (hotels[hotelIdx]) lines.push((en ? 'Hotel: ' : 'الفندق: ') + nm(hotels[hotelIdx].nameAr, hotels[hotelIdx].nameEn));
    if (flights[flightIdx]) lines.push((en ? 'Flight: ' : 'الرحلة: ') + nm(flights[flightIdx].nameAr, flights[flightIdx].nameEn));
    totals.lines.forEach((l) => lines.push('• ' + l.count + ' ' + (en ? l.type.en : l.type.ar) + ' × ' + formatPrice(l.unit, 'IQD', lang)));
    if (selectedDate) lines.push((en ? 'Date: ' : 'التاريخ: ') + selectedDate.date);
    lines.push((en ? 'Travellers: ' : 'عدد المسافرين: ') + travellerSummary(en));
    lines.push((en ? 'Grand total: ' : 'الإجمالي الكلي: ') + formatPrice(grandTotal, 'IQD', lang));
    if (includes.length) {
      lines.push('');
      lines.push(en ? "What's included:" : 'تشمل الباقة:');
      includes.forEach((i) => lines.push('• ' + i));
    }
    if (excludes.length) {
      lines.push('');
      lines.push(en ? 'Not included:' : 'السعر لا يشمل:');
      excludes.forEach((i) => lines.push('✗ ' + i));
    }
    lines.push('');
    lines.push('قصر المرايا للسفر والسياحة');
    return lines;
  }

  // Share the package with family and friends: the phone's own share sheet
  // when it has one, otherwise WhatsApp (any contact, not the company line).
  async function handleShare() {
    const en = lang === 'en';
    const url = window.location.origin + '/packages/' + pkg.id;
    const title = nm(pkg.title_ar, pkg.title_en);
    const text = [
      '✈️ ' + title + (destinationLabel(pkg, lang) ? ' — ' + destinationLabel(pkg, lang) : ''),
      nightsLabel(pkg, lang),
      Number(pkg.price) > 0 ? (en ? 'From ' : 'يبدأ من ') + formatPrice(pkg.price, 'IQD', lang) + (en ? ' per person' : ' للشخص') : '',
      en ? 'Qaser Almaraya Travel & Tourism' : 'قصر المرايا للسفر والسياحة',
    ].filter(Boolean).join('\n');
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const wa = 'https://wa.me/?text=' + encodeURIComponent(text + '\n' + url);
    const w = window.open(wa, '_blank', 'noopener');
    if (!w) window.location.href = wa;
  }

  function handleCopy() {
    copyText(packageSummaryLines().join('\n'), () => flashToast(t.copied_msg));
  }

  function travellerSummary(en) {
    return TRAVELLER_TYPES.map((t) => (counts[t.key] > 0 ? counts[t.key] + ' ' + (en ? t.en : t.ar) : null)).filter(Boolean).join(en ? ', ' : '، ');
  }

  function quoteDiscount() {
    const v = Number(quote.discount) || 0;
    if (!staffMode || v <= 0) return 0;
    const d = quote.discountType === 'percent' ? Math.round((grandTotal * Math.min(v, 100)) / 100) : v;
    return Math.min(d, grandTotal);
  }

  function handleDownloadPdf() {
    const discount = quoteDiscount();
    const bodyHtml = buildPackageVoucherHtml({
      pkg,
      hotel: hotels[hotelIdx],
      flight: flights[flightIdx],
      days,
      includes,
      excludes,
      adults,
      children,
      lines: totals.lines,
      units: totals.units,
      grandTotal,
      travellerSummary: travellerSummary(lang === 'en'),
      selectedDate,
      fmtPrice: (n) => formatPrice(n, 'IQD', lang),
      lang,
      startDate: selectedDate ? String(selectedDate.date || '') : '',
      pageUrl: window.location.href,
      quote: staffMode ? { customer: quote.customer.trim(), discount, discountLabel: quote.discountType === 'percent' && Number(quote.discount) > 0 ? Math.min(Number(quote.discount), 100) + '%' : '', validUntil: quote.validUntil, note: quote.note.trim() } : null,
    });
    printDoc(nm(pkg.title_ar, pkg.title_en) + ' — ' + destinationLabel(pkg, lang) + (staffMode && quote.customer.trim() ? ' — ' + quote.customer.trim() : ''), bodyHtml, lang);
  }

  // WhatsApp booking text, shared by the price card button and the phone bar.
  const waMessage = () => {
    const h = hotels[hotelIdx];
    const f = flights[flightIdx];
    const en = lang === 'en';
    return packageMessage({
      title: nm(pkg.title_ar, pkg.title_en),
      dest: destinationLabel(pkg, lang),
      nights: nightsLabel(pkg, lang),
      hotel: h ? nm(h.nameAr, h.nameEn) + ((h.notesAr || h.notesEn) ? ' (' + nm(h.notesAr, h.notesEn) + ')' : '') : '',
      flight: f ? nm(f.nameAr, f.nameEn) : '',
      travellers: travellerSummary(en),
      date: selectedDate ? String(selectedDate.date || '') : '',
      url: window.location.href,
    }, lang);
  };

  // Destination clock and the short travel guide (folded, in the main column).
  const clockProps = (() => {
    if (!pkg) return null;
    const cs = Array.isArray(pkg.countries) ? pkg.countries : [];
    const iso = cs[0] ? String(cs[0]).toLowerCase() : null;
    const tz = destinationTz(iso, cs.length === 1 ? destinationLabel(pkg, lang) + ' ' + (hotels[hotelIdx]?.location || '') : '');
    if (!tz || iso === 'iq') return null;
    const g = COUNTRY_GEO[iso];
    const place = cs.length === 1 ? destinationLabel(pkg, lang) : g ? (lang === 'en' ? g[4] : g[3]) : destinationLabel(pkg, lang);
    const f = flights[flightIdx];
    return { tz, place, flight: f ? { arrive: f.outArriveTime, depart: f.retDepartTime } : null };
  })();
  const guideIso = (() => { if (!pkg) return null; const iso = packageCountries(pkg)[0]; return iso && guideFor(iso, lang) ? iso : null; })();
  const guideMonth = (() => {
    if (!pkg) return null;
    const d = (selectedDate && String(selectedDate.date || '')) || nextDeparture(pkg);
    return /^\d{4}-\d{2}/.test(d || '') ? Number(d.slice(5, 7)) - 1 : null;
  })();

  // The page's one primary action: same destination as before (the booking
  // steps when they are switched on, otherwise the WhatsApp booking message).
  const bookNow = APPLY_FLOW_ENABLED ? goBook : () => openWhatsApp(waMessage());
  const bookLabel = APPLY_FLOW_ENABLED
    ? { label: T.ar.detail_cta, labelEn: T.en.detail_cta }
    : { label: 'احجز هذه الباقة عبر واتساب', labelEn: 'Book this package on WhatsApp' };
  const bookLabelShort = APPLY_FLOW_ENABLED
    ? bookLabel
    : { label: 'احجز عبر واتساب', labelEn: 'Book on WhatsApp' };

  if (error) {
    return (
      <div dir={lang === 'en' ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="المجموعات والباقات" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <p style={{ color: 'var(--qd-red,#d2324f)', background: 'var(--qd-redbg,#fdecef)', border: '1px solid var(--qd-redline,#f7c3cc)', borderRadius: 'var(--tw-radius-sm,10px)', padding: '14px 20px' }}>{error}</p>
            <Link href="/packages" className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>{t.back_to_results}</Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }
  if (!pkg) {
    return (
      <div dir={lang === 'en' ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="المجموعات والباقات" />
        <main style={{ flex: 1 }} />
        <SiteFooter />
        <MascotLoader assetBase="/assets" />
      </div>
    );
  }

  return (
    <div dir={lang === 'en' ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="المجموعات والباقات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          <section className={'qs-pd-hero' + (pkg.image_url ? '' : ' qs-pd-hero-plain')}>
            {pkg.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="qs-pd-hero-img" {...imgProps(pkg.image_url, '100vw', [828, 1200, 1920])} alt="" fetchPriority="high" decoding="async" />
            ) : null}
            <div className="qs-wrap qs-pd-hero-in">
              <Link href="/packages" className="qs-pd-back">{t.back_to_results}</Link>
              <div className="qs-pd-hero-copy">
                {(pkg.badge_ar || pkg.badge_en) && <span className="qs-pd-badge">{nm(pkg.badge_ar, pkg.badge_en)}</span>}
                <span className="qs-pd-cat">{catLabel(pkg.cat, lang)}</span>
                <h1 className="qs-pd-title">{nm(pkg.title_ar, pkg.title_en)}</h1>
                <span className="qs-pd-sub">{destinationLabel(pkg, lang)} · {nightsLabel(pkg, lang)}</span>
                <CtaButton className="qr-hero-cta" onClick={bookNow} disabled={noAdults} lang={lang} {...bookLabelShort} />
              </div>
            </div>
          </section>
          <div className="qs-wrap">
            <dl className="qs-pd-facts">
              {[
                [lang === 'en' ? 'Destination' : 'الوجهة', destinationLabel(pkg, lang)],
                [lang === 'en' ? 'Duration' : 'المدة', durationLabel(pkg, lang) || nightsLabel(pkg, lang)],
                [lang === 'en' ? 'Departures' : 'المغادرة', nm(pkg.departs_ar, pkg.departs_en)],
                [t.detail_base, formatPrice(Number(pkg.price) || 0, 'IQD', lang)],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </div>

          <section className="qa-sec qa-2col qa-detail qs-pd" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(300px,380px)', gap: 48, alignItems: 'flex-start' }}>
            {/* Sticky price summary */}
            <div className="qa-card qs-pd-book" style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="qs-pd-price">
                <span>{t.detail_total_pp}</span>
                <b>{formatPrice(totalPerAdult, 'IQD', lang)}</b>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--qs-ink-2,#5f666e)' }}>{t.detail_base}</span><span>{formatPrice(Number(pkg.price) || 0, 'IQD', lang)}</span></div>
                {upgrade !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--qs-ink-2,#5f666e)' }}>{t.detail_upgrade}</span><span>{formatSignedPrice(upgrade, 'IQD', lang)}</span></div>
                )}
              </div>

              {availableDates.length > 0 && (
                <div style={{ borderTop: '1px solid var(--qs-line,#ececed)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{lang === 'en' ? 'Choose a departure date' : 'اختر تاريخ الانطلاق'}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {availableDates.map((d, i) => (
                      <button key={d.date} type="button" onClick={() => setDateIdx(i)}
                        style={{ borderRadius: 'var(--tw-radius-sm,10px)', padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, border: i === dateIdx ? '2px solid var(--qs-brand-deep,#049dc5)' : '1px solid var(--qs-line,#ececed)', background: i === dateIdx ? 'var(--qs-brand-soft,#eaf8fd)' : 'var(--qd-surface2,#fff)', color: 'var(--qs-ink,#1d2733)' }}>
                        <span dir="ltr">{new Date(d.date).toLocaleDateString(lang === 'en' ? 'en-GB' : 'ar-IQ-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {d.adjust ? <span style={{ display: 'block', fontSize: 13, color: d.adjust > 0 ? 'var(--qd-ambertext,#c27a00)' : 'var(--qd-green,#1a7f47)' }}>{formatSignedPrice(d.adjust, 'IQD', lang)}</span> : null}
                      </button>
                    ))}
                  </div>
                  {selectedDate && returnDate(pkg, selectedDate.date) && (
                    <div data-no-i18n="" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 15, background: 'var(--qd-surface2,#f3fafc)', border: '1px solid var(--qd-line,#d9e9ef)', borderRadius: 'var(--tw-radius-sm,10px)', padding: '8px 12px' }}>
                      <Icon name="calendar-days" size={16} style={{ color: 'var(--qs-brand-deep,#036f8c)', flex: 'none' }} />
                      <span>{lang === 'en' ? 'Departure' : 'الانطلاق'} <b dir="ltr">{fmtTripDate(selectedDate.date, lang)}</b></span>
                      <span style={{ color: 'var(--qd-ink3,#b0b6bb)' }}>·</span>
                      <span>{lang === 'en' ? 'Return' : 'العودة'} <b dir="ltr">{fmtTripDate(returnDate(pkg, selectedDate.date), lang)}</b></span>
                      <span style={{ color: 'var(--qs-ink-2,#5f666e)' }}>({tripDays(pkg)} {lang === 'en' ? 'days' : 'أيام'})</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--qs-line,#ececed)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{lang === 'en' ? 'Travellers' : 'المسافرون'}</span>
                {TRAVELLER_TYPES.map((tt) => {
                  const label = lang === 'en' ? tt.en : tt.ar;
                  const hint = lang === 'en' ? tt.hintEn : tt.hintAr;
                  const unit = totals.units ? totals.units[tt.key] : unitPrice(pkg, tt, upgrade);
                  return (
                    <div key={tt.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 15, color: unit == null ? 'var(--qd-ink3,#b0b6bb)' : 'var(--qs-ink,#1d2733)' }}>{label}{hint ? <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)' }}> ({hint})</span> : null}
                        {unit == null ? <span style={{ display: 'block', fontSize: 13, color: 'var(--qd-ink3,#b0b6bb)' }}>{lang === 'en' ? 'Not available for this hotel' : 'غير متاح لهذا الفندق'}</span>
                          : counts[tt.key] > 0 && <span style={{ display: 'block', fontSize: 13, color: 'var(--qs-ink-2,#5f666e)' }}>{formatPrice(unit, 'IQD', lang)}</span>}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button type="button" disabled={counts[tt.key] <= 0} onClick={() => setCounts((c) => ({ ...c, [tt.key]: Math.max(0, c[tt.key] - 1) }))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--qs-line-2,#cacbcc)', background: 'var(--qd-surface,#fff)', cursor: counts[tt.key] <= 0 ? 'not-allowed' : 'pointer', opacity: counts[tt.key] <= 0 ? 0.4 : 1 }}>−</button>
                        <span style={{ minWidth: 18, textAlign: 'center' }}>{counts[tt.key]}</span>
                        <button type="button" disabled={unit == null} onClick={() => setCounts((c) => ({ ...c, [tt.key]: c[tt.key] + 1 }))} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--qs-line-2,#cacbcc)', background: 'var(--qd-surface,#fff)', cursor: unit == null ? 'not-allowed' : 'pointer', opacity: unit == null ? 0.4 : 1 }}>+</button>
                      </div>
                    </div>
                  );
                })}
                {noAdults && (
                  <span role="alert" style={{ fontSize: 13, fontWeight: 500, color: 'var(--qd-red,#d2324f)', background: 'var(--qd-redbg,#fdecef)', border: '1px solid var(--qd-redline,#f7c3cc)', borderRadius: 'var(--tw-radius-xs,8px)', padding: '8px 10px' }}>{noAdultsMsg}</span>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--qs-line,#ececed)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {totals.lines.map((l) => (
                  <div key={l.type.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--qd-ink2,#5b646d)' }}>
                    <span>{l.count} {lang === 'en' ? l.type.en : l.type.ar} × {formatPrice(l.unit, 'IQD', lang)}</span>
                    <span>{formatPrice(l.subtotal, 'IQD', lang)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 600, marginTop: 4 }}>
                  <span>{t.detail_total}</span>
                  <span style={{ color: 'var(--qs-brand-deep,#049dc5)' }}>{formatPrice(grandTotal, 'IQD', lang)}</span>
                </div>
              </div>

              <UrgencyPanel pkg={pkg} lang={lang} />
              {staffMode && (
                <div style={{ border: '2px dashed #faab18', background: 'var(--qd-amberbg,#fffaf0)', borderRadius: 'var(--tw-radius-sm,10px)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <b style={{ fontSize: 15, color: 'var(--qd-ambertext,#8a5a00)' }}>عرض سعر مخصص (وضع الموظفين)</b>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--qs-brand-deep,#036f8c)' }} dir="auto">المورد: {(staffHints && staffHints[pkg.id] && staffHints[pkg.id].supplier_name) || '—'}</span>
                  <input style={{ padding: '8px 10px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit' }} placeholder="اسم العميل — مثال: أحمد علي" value={quote.customer} onChange={(e) => setQuote({ ...quote, customer: e.target.value })} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select style={{ padding: '8px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit' }} value={quote.discountType} onChange={(e) => setQuote({ ...quote, discountType: e.target.value })}>
                      <option value="amount">خصم بالدينار</option>
                      <option value="percent">خصم بالنسبة %</option>
                    </select>
                    <input type="number" min="0" style={{ flex: 1, minWidth: 0, padding: '8px 10px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit' }} placeholder={quote.discountType === 'percent' ? 'مثال 10' : 'مثال 100000'} value={quote.discount} onChange={(e) => setQuote({ ...quote, discount: e.target.value })} />
                  </div>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--qs-ink-2,#5f666e)' }}>العرض صالح حتى (اختياري)
                    <input type="date" style={{ padding: '8px 10px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit' }} value={quote.validUntil} onChange={(e) => setQuote({ ...quote, validUntil: e.target.value })} />
                  </label>
                  <textarea style={{ padding: '8px 10px', borderRadius: 'var(--tw-radius-xs,8px)', border: '1px solid var(--qs-line,#ececed)', fontFamily: 'inherit', minHeight: 56 }} placeholder="ملاحظة خاصة للعميل (اختياري)" value={quote.note} onChange={(e) => setQuote({ ...quote, note: e.target.value })} />
                  {quoteDiscount() > 0 && (
                    <span style={{ fontSize: 13 }}>الإجمالي بعد الخصم: <b data-no-i18n="">{formatPrice(grandTotal - quoteDiscount(), 'IQD', lang)}</b> <s data-no-i18n="" style={{ color: 'var(--qs-ink-2,#5f666e)' }}>{formatPrice(grandTotal, 'IQD', lang)}</s></span>
                  )}
                  <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)' }}>يظهر اسم العميل والخصم في ملف PDF فقط — لا يراه أحد غيرك على الموقع.</span>
                </div>
              )}
              <div ref={ctaRef} className="qr-book-cta">
                <CtaButton onClick={bookNow} disabled={noAdults} lang={lang} {...bookLabel} />
                {!APPLY_FLOW_ENABLED && <a href="tel:6393" className="qs-pd-call" data-no-i18n="">{lang === 'en' ? 'or call the hotline 6393' : 'أو اتصل على الخط الساخن 6393'}</a>}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="qs-pd-tool"
                >
                  <Icon name="file-text" size={15} />
                  {t.pdf_btn}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="qs-pd-tool"
                >
                  <Icon name="copy" size={15} />
                  {t.copy_btn}
                </button>
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="qa-share-btn qs-pd-tool"
              >
                <Icon name="send" size={15} />
                {lang === 'en' ? 'Share this package with family & friends' : 'شارك الباقة مع أهلك وأصدقائك'}
              </button>
              {toast && (
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--qs-brand-deep,#036f8c)', background: 'var(--qs-brand-soft,#eaf8fd)', border: '1px solid var(--qs-line-2,#bfe9f6)', borderRadius: 'var(--tw-radius-xs,8px)', padding: '6px 10px', textAlign: 'center' }}>{toast}</span>
              )}

              <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)', textAlign: 'center' }}>{t.detail_note}</span>
            </div>

            {/* Main content: choose the hotel and flight, then the folded detail, then the closing action */}
            <div className="qa-detail-main qs-pd-main" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {hotels.length > 0 && (
                <div className="qs-pd-block">
                  <h2 className="qs-pd-h">{t.hotel_title}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {hotels.map((h, idx) => (
                      <div key={idx} className="qa-opt-hotel" style={optStyle(hotelIdx === idx)} onClick={() => setHotelIdx(idx)}>
                        <input type="radio" checked={hotelIdx === idx} onChange={() => setHotelIdx(idx)} style={{ flex: 'none' }} />
                        {h.imageUrl ? (
                          <img {...imgProps(h.imageUrl, '44px', [384])} alt="" loading="lazy" style={{ width: 44, height: 44, borderRadius: 'var(--tw-radius-xs,8px)', objectFit: 'cover', flex: 'none' }} />
                        ) : null}
                        <span className="qa-opt-name" style={{ flex: 1, fontSize: 15, color: 'var(--qs-ink,#1d2733)' }}>
                          {nm(h.nameAr, h.nameEn)}
                          {(h.notesAr || h.notesEn) && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--qd-green,#1a7f47)', fontWeight: 600, marginTop: 2 }}><Icon name="utensils" size={12} style={{ flex: 'none' }} />{nm(h.notesAr, h.notesEn)}</span>}
                        </span>
                        <span className="qa-opt-price" style={{ fontSize: 15, fontWeight: 600, color: (h.extras?.adult ?? h.diff) ? 'var(--qs-brand-deep,#049dc5)' : 'var(--qs-ink-2,#5f666e)' }}>{(h.extras?.adult ?? h.diff) ? formatSignedPrice(h.extras?.adult ?? h.diff, 'IQD', lang) : (lang === 'en' ? 'Included' : 'مشمول')}</span>
                      </div>
                    ))}
                  </div>

                  {hotels[hotelIdx]?.locationUrl ? (
                    <a href={hotels[hotelIdx].locationUrl} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 600, color: 'var(--qs-brand-deep,#049dc5)', textDecoration: 'none' }}>
                      <Icon name="map-pin" size={16} /> {lang === 'en' ? 'View hotel location' : 'موقع الفندق على الخريطة'}
                    </a>
                  ) : null}

                  {hotels[hotelIdx] && ((hotels[hotelIdx].extraImages || []).length > 0 || hotels[hotelIdx].imageUrl) ? (
                    <div style={{ marginTop: 16, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      {[hotels[hotelIdx].imageUrl, ...(hotels[hotelIdx].extraImages || [])].filter(Boolean).map((src, i) => (
                        <img
                          key={i}
                          {...imgProps(src, '130px', [384])}
                          alt=""
                          loading="lazy"
                          style={{ width: 130, height: 96, borderRadius: 'var(--tw-radius-sm,10px)', objectFit: 'cover', flex: 'none', border: '1px solid var(--qs-line,#ececed)' }}
                        />
                      ))}
                    </div>
                  ) : null}

                  {selectedHotelCoords ? (
                    <div style={{ marginTop: 16, borderRadius: 'var(--tw-radius,16px)', overflow: 'hidden', border: '1px solid var(--qs-line,#ececed)' }}>
                      <iframe
                        key={`${selectedHotelCoords.lat},${selectedHotelCoords.lng}`}
                        title={lang === 'en' ? 'Hotel location' : 'موقع الفندق'}
                        width="100%"
                        height="260"
                        style={{ border: 0, display: 'block' }}
                        loading="lazy"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedHotelCoords.lng - 0.01}%2C${selectedHotelCoords.lat - 0.01}%2C${selectedHotelCoords.lng + 0.01}%2C${selectedHotelCoords.lat + 0.01}&layer=mapnik&marker=${selectedHotelCoords.lat}%2C${selectedHotelCoords.lng}`}
                      />
                      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'var(--qd-surface2,#f8fbfc)' }}>
                        <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="map-pin" size={13} style={{ color: 'var(--qs-brand-deep,#049dc5)' }} />
                          {nm(hotels[hotelIdx]?.nameAr, hotels[hotelIdx]?.nameEn)}
                        </span>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${selectedHotelCoords.lat}&mlon=${selectedHotelCoords.lng}#map=16/${selectedHotelCoords.lat}/${selectedHotelCoords.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 13, fontWeight: 500, color: 'var(--qs-brand-deep,#036f8c)', textDecoration: 'none' }}
                        >
                          {lang === 'en' ? 'Get directions ↗' : 'الاتجاهات ↗'}
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {flights.length > 0 && (
                <div className="qs-pd-block">
                  <h2 className="qs-pd-h">{t.flight_title}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {flights.map((f, idx) => (
                      <div key={idx} style={optStyle(flightIdx === idx)} onClick={() => setFlightIdx(idx)}>
                        <input type="radio" checked={flightIdx === idx} onChange={() => setFlightIdx(idx)} style={{ flex: 'none' }} />
                        <span style={{ flex: 1, fontSize: 15, color: 'var(--qs-ink,#1d2733)' }}>{nm(f.nameAr, f.nameEn)}</span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: f.diff ? 'var(--qs-brand-deep,#049dc5)' : 'var(--qs-ink-2,#5f666e)' }}>{f.diff ? formatSignedPrice(f.diff, 'IQD', lang) : (lang === 'en' ? 'Included' : 'مشمول')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(includes.length > 0 || excludes.length > 0 || days.length > 0 || generalNotes.length > 0 || clockProps || guideIso) && (
                <div className="qs-pd-block">
                  <h2 className="qs-pd-h" data-no-i18n="">{lang === 'en' ? 'Package details' : 'تفاصيل الباقة'}</h2>
                  <Accordion>
                    {(includes.length > 0 || excludes.length > 0) && (
                      <AccordionItem title={lang === 'en' ? 'What the price covers' : 'ماذا يشمل السعر'} noI18n icon="receipt" defaultOpen>
                        <div className="qr-cover">
                          {includes.length > 0 && (
                            <div className="qr-cover-col">
                              <span className="qr-cover-h">{lang === 'en' ? 'Price includes' : 'السعر يشمل'}</span>
                              <ul className="qr-list">
                                {includes.map((i, idx) => (
                                  <li key={idx}><Icon name="check" size={16} className="qr-yes" /><span>{i}</span></li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {excludes.length > 0 && (
                            <div className="qr-cover-col">
                              <span className="qr-cover-h">{lang === 'en' ? 'Not included' : 'السعر لا يشمل'}</span>
                              <ul className="qr-list">
                                {excludes.map((i, idx) => (
                                  <li key={idx}><Icon name="x" size={16} className="qr-no" /><span>{i}</span></li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionItem>
                    )}

                    {days.length > 0 && (
                      <AccordionItem title={t.calendar_title} icon="calendar-days" meta={days.length}>
                        <ol className="qr-days">
                          {days.map((d, idx) => (
                            <li key={idx}>
                              <span className="qr-day-t">{stripFlags(nm(d.titleAr, d.titleEn))}</span>
                              <span className="qr-day-d">{stripFlags(nm(d.descAr, d.descEn))}</span>
                            </li>
                          ))}
                        </ol>
                      </AccordionItem>
                    )}

                    {generalNotes.length > 0 && (
                      <AccordionItem title={lang === 'en' ? 'Important notes' : 'ملاحظات مهمة'} noI18n icon="info" meta={generalNotes.length}>
                        <ul className="qr-notes">
                          {generalNotes.map((l, i) => <li key={i}>{l}</li>)}
                        </ul>
                      </AccordionItem>
                    )}

                    {(clockProps || guideIso) && (
                      <AccordionItem title={lang === 'en' ? 'Before you travel: time, weather and money' : 'قبل السفر: التوقيت والطقس والعملة'} noI18n icon="compass">
                        <div className="qr-before">
                          {clockProps ? <WorldClocks {...clockProps} lang={lang} compact /> : null}
                          {guideIso ? <GuideCompact iso={guideIso} lang={lang} month={guideMonth} bare /> : null}
                        </div>
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              )}

              {/* Closing action: the same booking button again, with the total it books */}
              <div className="qr-close" data-no-i18n="">
                <div className="qr-close-copy">
                  <h2 className="qr-close-h">{lang === 'en' ? 'Book your place on this trip' : 'احجز مكانك في هذه الرحلة'}</h2>
                  <p className="qr-close-p">
                    {grandTotal > 0 ? (lang === 'en' ? 'Total' : 'المجموع') + ' · ' + travellerSummary(lang === 'en') : t.detail_total_pp}
                    <b>{formatPrice(grandTotal > 0 ? grandTotal : totalPerAdult, 'IQD', lang)}</b>
                  </p>
                </div>
                <div className="qr-close-act">
                  <CtaButton size="lg" onClick={bookNow} disabled={noAdults} lang={lang} {...bookLabel} />
                  {!APPLY_FLOW_ENABLED && <a href="tel:6393" className="qs-pd-call">{lang === 'en' ? 'or call the hotline 6393' : 'أو اتصل على الخط الساخن 6393'}</a>}
                </div>
              </div>
            </div>
          </section>
        </div>
        {!APPLY_FLOW_ENABLED && (
          <div className={'qa-pkg-mbar' + (showBar ? ' on' : '')} data-no-i18n="" aria-hidden={!showBar}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
              <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)' }}>{grandTotal > 0 ? (lang === 'en' ? 'Total' : 'المجموع') + ' · ' + travellerSummary(lang === 'en') : t.detail_total_pp}</span>
              <b style={{ fontSize: 17, color: 'var(--qs-brand-deep,#036f8c)', whiteSpace: 'nowrap' }}>{formatPrice(grandTotal > 0 ? grandTotal : totalPerAdult, 'IQD', lang)}</b>
            </div>
            {noAdults ? (
              <button type="button" disabled className="qa-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25d366', color: '#fff', border: 0, fontWeight: 600, padding: '10px 16px', fontSize: 15, minHeight: 0, whiteSpace: 'nowrap', flexShrink: 0, opacity: 0.5, cursor: 'not-allowed' }}>
                {WA_ICON}
                <span>{lang === 'en' ? 'Book on WhatsApp' : 'احجز عبر واتساب'}</span>
              </button>
            ) : (
            <WhatsAppButton label={lang === 'en' ? 'Book on WhatsApp' : 'احجز عبر واتساب'} getMessage={waMessage} style={{ padding: '10px 16px', fontSize: 15, minHeight: 0, whiteSpace: 'nowrap', flexShrink: 0 }} />
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
