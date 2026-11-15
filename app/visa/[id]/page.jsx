'use client';
import Icon from '../../../components/Icon';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { buildVisaPdfHtml, findCountryIso } from '../../../lib/visaPdf';
import WorldClocks, { destinationTz } from '../../../components/WorldClocks';
import { APPLY_FLOW_ENABLED, visaMessage, openWhatsApp } from '../../../lib/whatsapp';
import CtaButton from '../../../components/CtaButton';
import { Accordion, AccordionItem } from '../../../components/routes/Accordion';
import SiteHeader from '../../../components/SiteHeader';
import SiteFooter from '../../../components/SiteFooter';
import MascotLoader from '../../../components/MascotLoader';
import { printDoc, visaTableHtml, combinedDocsLine, esc } from '../../../lib/printDoc';
import { useLangToggle } from '../../../lib/i18n';
import { formatPrice, formatRawAmount } from '../../../lib/currency';
import { flagSrc } from '../../../lib/flags';
import { useProviderReveal } from '../../../lib/useProviderReveal';
import { workDaysLabel } from '../../../lib/destinations';

const WHY_US = [
  'مراجعة كاملة لمستنداتك قبل التقديم',
  'متابعة حالة الطلب حتى الإصدار',
  'دعم مباشر على واتساب طوال الوقت',
];

export default function VisaDetailPage() {
  const { lang } = useLangToggle();
  const { providers: providerHints, denied: providerDenied } = useProviderReveal();
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);
  const { id } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/visa/cards/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError('تعذّر تحميل بيانات التأشيرة');
        else setCard(data);
      })
      .catch(() => setError('تعذّر تحميل بيانات التأشيرة'));
  }, [id]);

  if (error) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="التأشيرات" />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <p style={{ color: '#d2324f', background: '#fdecef', border: '1px solid #f7c3cc', borderRadius: 'var(--tw-radius-sm,10px)', padding: '14px 20px' }}>{error}</p>
            <Link href="/visa" className="qa-btn qa-cyan" style={{ textDecoration: 'none' }}>← رجوع إلى التأشيرات</Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }
  if (!card) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SiteHeader active="التأشيرات" />
        <main style={{ flex: 1 }} />
        <SiteFooter />
        <MascotLoader assetBase="/assets" />
      </div>
    );
  }

  const included = [
    { label: 'نحجز لك موعداً في السفارة', on: !!card.needs_appointment },
    { label: 'تستلم ملف التأشيرة للتحميل', on: !!card.delivers_visa_file },
    { label: 'نجهّز الأوراق: الاستمارة والحجوزات والتأمين والترجمة', on: !!card.prepares_papers },
    { label: 'نستلم جوازك ونعيده لاحقاً', on: !!card.collects_passport },
    { label: 'النتيجة مضمونة', on: !!card.result_guaranteed },
  ];

  const requiredDocs = (card.documents || []).filter((d) => d.required);
  const optionalDocs = (card.documents || []).filter((d) => !d.required);

  // Standalone services (driving permit, health insurance) store the same text
  // in both the type and country name — show it once instead of "X — X".
  const typeLabel = nm(card.visa_type_name_ar, card.visa_type_name_en);
  const countryLabel = nm(card.country_name_ar, card.country_name_en);
  const cardTitle = typeLabel && countryLabel && typeLabel.trim() === countryLabel.trim()
    ? countryLabel
    : [typeLabel, countryLabel].filter(Boolean).join(' — ');

  // The page's one primary action: same destination as before (the application
  // steps when they are switched on, otherwise the WhatsApp message for this visa).
  const applyOnWhatsApp = () => openWhatsApp(visaMessage({
    type: nm(card.visa_type_name_ar, card.visa_type_name_en),
    country: nm(card.country_name_ar, card.country_name_en),
    stay: card.stay_duration,
    issuing: workDaysLabel(card.issuing_time_days),
    validity: card.validity_before_travel,
    url: window.location.href,
  }));
  const applyCta = (size) => (APPLY_FLOW_ENABLED
    ? <CtaButton size={size} href={`/visa/${id}/apply`} label="ابدأ الآن" />
    : <CtaButton size={size} onClick={applyOnWhatsApp} label="تواصل معنا على واتساب للتقديم" />);
  const downloadPdf = () => {
    const bodyHtml = buildVisaPdfHtml({ cards: [card], lang, fmtPrice: (n) => formatPrice(n, 'IQD', lang), pageUrl: window.location.href });
    printDoc(cardTitle, bodyHtml, lang);
  };
  const photo = card.image_url || card.card_image_url;
  const clockTz = (() => {
    const iso = findCountryIso(card);
    return iso && iso !== 'iq' ? destinationTz(iso) : null;
  })();
  const shownIncluded = included.filter((f) => f.on);
  const notes = nm(card.booking_notes, card.booking_notes_en);

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader active="التأشيرات" />
      <main style={{ flex: 1 }}>
        <div className="qa-page">
          <div className="qa-sec" style={{ paddingBottom: 0 }}>
            <Link href={`/visa/country/${card.country_id}`} style={{ fontSize: 15, fontWeight: 600, color: 'var(--qs-brand-deep,#036f8c)', textDecoration: 'none' }}>← رجوع</Link>
          </div>

          <section className="qa-sec qa-2col qa-detail qr-vd" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,340px) 1fr', gap: 32, alignItems: 'flex-start' }}>
            {/* Price and the apply action */}
            <div className="qa-card qa-visa-side qr-vd-side" style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>{cardTitle}</h3>
              <div className="qr-vd-prices">
                <div>
                  <span>البالغ</span>
                  <b>{formatPrice(card.adult_price, 'IQD', lang)}</b>
                </div>
                <div>
                  <span>الطفل</span>
                  <b>{formatPrice(card.child_price, 'IQD', lang)}</b>
                </div>
              </div>
              {applyCta('md')}
              <button type="button" onClick={downloadPdf} className="qs-pd-tool qr-vd-pdf">
                <Icon name="file-text" size={15} />
                تحميل PDF لهذه التأشيرة
              </button>
              <span style={{ fontSize: 13, color: 'var(--qs-ink-2,#5f666e)', textAlign: 'center' }}>السعر بالدينار العراقي، ويُثبَّت عند تقديم الطلب.</span>
            </div>

            <div className="qa-detail-main" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="qa-detail-hero qr-vd-hero" style={{ position: 'relative', height: 260, borderRadius: 'var(--tw-radius,16px)', overflow: 'hidden', background: photo ? `url("${photo}") center/cover no-repeat, var(--tw-band-deep,#049dc5)` : 'var(--tw-band-deep,#049dc5)', display: 'flex', alignItems: 'flex-end', padding: 24 }}>
                {photo && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(1,30,40,.78) 0%, rgba(1,30,40,.25) 55%, rgba(1,30,40,.05) 100%)' }} />
                )}
                {providerHints && providerHints[card.id] && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 20,
                      insetInlineStart: 20,
                      insetInlineEnd: 90,
                      zIndex: 2,
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--qs-brand-deep,#036f8c)',
                      background: 'rgba(255,255,255,.96)',
                      borderRadius: 'var(--tw-radius-sm,10px)',
                      padding: '6px 12px',
                      boxShadow: 'var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                    title="معلومات داخلية — تظهر لفريق العمل فقط"
                  >
                    {providerHints[card.id].provider_name ? <span>{providerHints[card.id].provider_name}</span> : null}
                    <span style={{ color: 'var(--qs-ink-2,#5f666e)', fontWeight: 600 }}>
                      {lang === 'en' ? 'Cost: ' : 'التكلفة: '}
                      {formatRawAmount(providerHints[card.id].adult_cost, providerHints[card.id].cost_currency || 'IQD', lang)}
                      {lang === 'en' ? ' / adult, ' : ' للبالغ، '}
                      {formatRawAmount(providerHints[card.id].child_cost, providerHints[card.id].cost_currency || 'IQD', lang)}
                      {lang === 'en' ? ' / child' : ' للطفل'}
                    </span>
                  </span>
                )}
                {card.flag_code ? (
                  <img
                    src={flagSrc(card.flag_code)}
                    alt=""
                    style={{ position: 'absolute', top: 24, right: 24, zIndex: 1, width: 48, height: 48, borderRadius: '50%', border: '2px solid #fff', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h1 style={{ margin: 0, fontSize: 32, color: '#fff' }}>{nm(card.country_name_ar, card.country_name_en)}</h1>
                  <span style={{ fontSize: 15, color: 'rgba(255,255,255,.92)' }}>{nm(card.visa_type_name_ar, card.visa_type_name_en)} · إقامة {card.stay_duration || '—'}</span>
                </div>
              </div>

              {/* Durations and dates, read together */}
              <div className="qr-vd-block">
                <h2 className="qr-vd-h">بطاقة التأشيرة</h2>
                <dl className="qr-facts">
                  {[
                    ['النوع', nm(card.visa_type_name_ar, card.visa_type_name_en)],
                    ['مدة الإقامة', card.stay_duration || '—'],
                    ['مدة الإصدار', workDaysLabel(card.issuing_time_days) || '—'],
                    ['صلاحية قبل السفر', card.validity_before_travel || '—'],
                  ].map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                  ))}
                </dl>
              </div>

              {((card.documents || []).length > 0 || shownIncluded.length > 0 || notes || clockTz) && (
                <div className="qr-vd-block">
                  <Accordion>
                    {(card.documents || []).length > 0 && (
                      <AccordionItem title="المستندات المطلوبة" icon="file-text" meta={card.documents.length} defaultOpen>
                        <ul className="qr-docs">
                          {[...requiredDocs, ...optionalDocs].map((d) => (
                            <li key={d.id} className="qa-doc-row">
                              <div>
                                <div className="qr-doc-n">{d.name_ar}</div>
                                <div className="qr-doc-k">{d.kind === 'file' ? 'رفع ملف' : d.kind === 'photo' ? 'رفع صورة' : 'إجابة'} · {d.audience === 'adults' ? 'البالغين' : d.audience === 'children' ? 'الأطفال' : 'الجميع'}</div>
                              </div>
                              <span className={'qr-doc-tag' + (d.required ? ' is-req' : '')}>{d.required ? 'مطلوب' : 'اختياري'}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionItem>
                    )}

                    {shownIncluded.length > 0 && (
                      <AccordionItem title="ما يشمله هذا النوع" icon="shield-check" meta={shownIncluded.length}>
                        <ul className="qr-list">
                          {shownIncluded.map((f) => (
                            <li key={f.label} className="qa-feat-row"><Icon name="check" size={16} className="qr-yes" /><span>{f.label}</span></li>
                          ))}
                        </ul>
                      </AccordionItem>
                    )}

                    {(card.booking_notes || card.booking_notes_en) && (
                      <AccordionItem title="معلومات إضافية" icon="info">
                        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: 'var(--qs-body,#3d4650)', whiteSpace: 'pre-wrap', maxWidth: 720 }}>
                          {notes}
                        </p>
                      </AccordionItem>
                    )}

                    {clockTz && (
                      <AccordionItem title={lang === 'en' ? 'Local time at the destination' : 'التوقيت في بلد الوجهة'} noI18n icon="clock">
                        <WorldClocks tz={clockTz} place={nm(card.country_name_ar, card.country_name_en)} lang={lang} compact />
                      </AccordionItem>
                    )}
                  </Accordion>
                </div>
              )}

              <div className="qr-vd-block">
                <h2 className="qr-vd-h">لماذا قصر المرايا؟</h2>
                <ol className="qr-why">
                  {WHY_US.map((w, i) => (
                    <li key={i}><span data-no-i18n="">{i + 1}</span>{w}</li>
                  ))}
                </ol>
              </div>

              {/* Closing action: the same apply button again, with the price it applies for */}
              <div className="qr-close">
                <div className="qr-close-copy">
                  <h2 className="qr-close-h">{cardTitle}</h2>
                  <p className="qr-close-p">
                    <span>البالغ</span>
                    <b>{formatPrice(card.adult_price, 'IQD', lang)}</b>
                  </p>
                </div>
                <div className="qr-close-act">
                  {applyCta('lg')}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
      {providerHints && (
        <div style={{ position: 'fixed', bottom: 18, insetInlineStart: 18, zIndex: 60, background: 'var(--qs-ink,#1d2733)', color: '#fff', fontSize: 13, fontWeight: 500, borderRadius: 999, padding: '8px 16px', boxShadow: 'var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))' }}>
          <Icon name="search" size={13} style={{ verticalAlign: '-2px', marginInlineEnd: 6 }} />وضع الموظفين مفعّل — اكتب نفس الكلمة السرية للإخفاء
        </div>
      )}
      {providerDenied && (
        <div style={{ position: 'fixed', bottom: 18, insetInlineStart: 18, zIndex: 60, background: '#d2324f', color: '#fff', fontSize: 13, fontWeight: 500, borderRadius: 999, padding: '8px 16px', boxShadow: 'var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))' }}>
          غير مصرح لك بعرض هذه المعلومات
        </div>
      )}
    </div>
  );
}
