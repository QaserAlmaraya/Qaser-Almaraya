'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { getRate, loadRate } from '../../lib/currency';
import { waLink } from '../../lib/whatsapp';
import { ORIGINS, FARES_UPDATED, destinationsFrom, destinationCount } from '../../lib/flightFares';

// "Fares from your city": pick the airport you leave from and see the lowest
// fare to every destination we sell from it, cheapest first. A row opens to
// show each airline on that route with its departure time and days, and a
// WhatsApp button that carries the chosen route. Prices are always dinars.
//
// `initial` rows are shown before "show all"; `link` adds the header link to
// the flights page (used on the homepage only).

const num = (n) => Number(n).toLocaleString('en-US');

function updatedLabel(ymd, en) {
  try {
    return new Intl.DateTimeFormat(en ? 'en-GB' : 'ar-IQ-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(ymd + 'T00:00:00Z'));
  } catch { return ymd; }
}

function bookingMessage({ origin, dest, trip, price, en }) {
  const tripText = trip === 'round' ? (en ? 'Round trip' : 'ذهاب وعودة') : (en ? 'One way' : 'ذهاب فقط');
  return en
    ? ['Hello, I would like to book a flight:', '✈️ ' + origin.en + ' to ' + dest.en, 'Trip: ' + tripText, 'Website price: from IQD ' + num(price)].join('\n')
    : ['مرحباً، أرغب بحجز تذكرة طيران:', '✈️ من ' + origin.ar + ' إلى ' + dest.ar, 'نوع الرحلة: ' + tripText, 'السعر في الموقع: يبدأ من ' + num(price) + ' د.ع'].join('\n');
}

function Price({ value, en, label }) {
  return (
    <span className="qs-fb-price">
      {label ? <small>{label}</small> : null}
      <span className="qs-fb-amount">
        {en ? <span>IQD</span> : null}<b>{num(value)}</b>{en ? null : <span>د.ع</span>}
      </span>
    </span>
  );
}

export default function FareBoard({ lang = 'ar', initial = 8, link = true }) {
  const en = lang === 'en';
  const [origin, setOrigin] = useState(ORIGINS[0].code);
  const [trip, setTrip] = useState('one');
  const [open, setOpen] = useState('');
  const [all, setAll] = useState(false);
  const [rate, setRate] = useState(getRate());

  useEffect(() => { let alive = true; loadRate().then((r) => { if (alive) setRate(r); }); return () => { alive = false; }; }, []);

  const from = ORIGINS.find((o) => o.code === origin) || ORIGINS[0];
  const dests = useMemo(() => destinationsFrom(origin, trip, rate), [origin, trip, rate]);
  const shown = all ? dests : dests.slice(0, initial);

  const pickOrigin = (code) => { setOrigin(code); setOpen(''); setAll(false); };
  const pickTrip = (t) => { setTrip(t); setOpen(''); };

  return (
    <section id="fares" className="qs-band qs-fb-band" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div className="qs-head">
          <div>
            <span className="qs-kicker">{en ? 'Flights' : 'الطيران'}</span>
            <h2 className="qs-h2">{en ? 'Ticket prices from your city' : 'أسعار التذاكر من مدينتك'}</h2>
            <p className="qs-lead">{en
              ? 'Choose the airport you leave from to see the lowest fare to each destination, then open a destination for its airlines and times.'
              : 'اختر مطار المغادرة لترى أقل سعر إلى كل وجهة، ثم افتح الوجهة لعرض شركات الطيران ومواعيدها.'}</p>
          </div>
          {link ? <Link href="/flights" className="qs-link">{en ? 'Flight booking' : 'حجز الطيران'}</Link> : null}
        </div>

        <div className="qs-fb">
          <div className="qs-fb-origins" role="tablist" aria-label={en ? 'Departure airport' : 'مطار المغادرة'}>
            {ORIGINS.map((o) => {
              const n = destinationCount(o.code);
              return (
                <button key={o.code} type="button" role="tab" aria-selected={o.code === origin} className="qs-fb-origin" onClick={() => pickOrigin(o.code)}>
                  <span className="qs-fb-code" dir="ltr" data-keep-dir="">{o.code}</span>
                  <span className="qs-fb-city">{en ? o.en : o.ar}</span>
                  <span className="qs-fb-n">{en ? n + (n === 1 ? ' destination' : ' destinations') : (n === 1 ? 'وجهة واحدة' : n === 2 ? 'وجهتان' : n <= 10 ? n + ' وجهات' : n + ' وجهة')}</span>
                </button>
              );
            })}
          </div>

          <div className="qs-fb-bar">
            <p className="qs-fb-route">
              {en ? 'Leaving from ' : 'المغادرة من '}<b>{en ? from.airportEn : from.airportAr}</b>
            </p>
            <div className="qs-fb-trip" role="group" aria-label={en ? 'Trip type' : 'نوع الرحلة'}>
              <button type="button" aria-pressed={trip === 'one'} onClick={() => pickTrip('one')}>{en ? 'One way' : 'ذهاب فقط'}</button>
              <button type="button" aria-pressed={trip === 'round'} onClick={() => pickTrip('round')}>{en ? 'Round trip' : 'ذهاب وعودة'}</button>
            </div>
          </div>

          <ol className="qs-fb-list" key={origin + trip}>
            {shown.map((d, i) => {
              const isOpen = open === d.key;
              const best = i === 0 && dests.length > 1;
              const airlines = d.offers.length;
              const sub = [en ? d.place.countryEn : d.place.countryAr, airlines > 1 ? (en ? airlines + ' airlines' : airlines === 2 ? 'شركتا طيران' : airlines + ' شركات طيران') : (en ? d.best.carrier.en : d.best.carrier.shortAr)].join(' · ');
              return (
                <li key={d.key} className={'qs-fb-item' + (isOpen ? ' open' : '') + (best ? ' best' : '')}>
                  <button type="button" className="qs-fb-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : d.key)} style={{ animationDelay: Math.min(i, 11) * 30 + 'ms' }}>
                    <span className="qs-fb-tag" dir="ltr" data-keep-dir="" aria-hidden="true">{d.key.toUpperCase()}</span>
                    <span className="qs-fb-dest">
                      <span className="qs-fb-name">{en ? d.place.en : d.place.ar}{best ? <span className="qs-fb-low">{en ? 'Lowest fare' : 'أقل سعر'}</span> : null}</span>
                      <small>{sub}</small>
                    </span>
                    <Price value={d.from} en={en} label={en ? 'From' : 'يبدأ من'} />
                    <Icon name="chevron-down" size={18} strokeWidth={2} className="qs-fb-chev" />
                  </button>
                  <div className="qs-fb-detail" hidden={!isOpen}>
                    <p className="qs-fb-leg">
                      <b>{en ? from.en + ' to ' + d.place.en : 'من ' + from.ar + ' إلى ' + d.place.ar}</b>
                      <span>{trip === 'round' ? (en ? 'Round trip' : 'ذهاب وعودة') : (en ? 'One way' : 'ذهاب فقط')}</span>
                    </p>
                    <ul className={d.offers.length > 1 ? 'many' : undefined}>
                      {d.offers.map((f, k) => {
                        const meta = [
                          [f.place.airportAr ? (en ? f.place.airportEn : f.place.airportAr) : '', f.time ? (en ? 'Departs ' : 'الإقلاع ') + f.time : ''].filter(Boolean).join(' · '),
                          en ? f.daysEn : f.daysAr,
                        ].filter(Boolean);
                        return (
                          <li key={k} className="qs-fb-offer">
                            {f.carrier.logo ? (
                              <span className="qs-fb-mark">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={'/assets/airlines-color/' + f.carrier.logo + '.webp'} alt="" loading="lazy" decoding="async" />
                              </span>
                            ) : (
                              <span className="qs-fb-mark qs-fb-tail" dir="ltr" data-keep-dir="" aria-hidden="true">{f.carrier.code || f.carrier.en}</span>
                            )}
                            <span className="qs-fb-carrier">
                              <span>{en ? f.carrier.en : f.carrier.ar}</span>
                              <small>{meta.map((m, j) => <span key={j}>{m}</span>)}</small>
                            </span>
                            <Price value={f.price} en={en} label={f.carrier.fixed ? (en ? 'Fixed fare' : 'سعر ثابت') : (en ? 'From' : 'يبدأ من')} />
                          </li>
                        );
                      })}
                    </ul>
                    <div className="qs-fb-cta">
                      <a className="qs-btn qs-btn-pri" href={waLink(bookingMessage({ origin: from, dest: d.place, trip, price: d.from, en }))} target="_blank" rel="noopener">
                        {en ? 'Book on WhatsApp' : 'احجز عبر واتساب'}
                      </a>
                      <a className="qs-fb-call" href="tel:6393">{en ? 'or call 6393' : 'أو اتصل على 6393'}</a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {dests.length > initial ? (
            <button type="button" className="qs-fb-more" onClick={() => setAll(!all)} aria-expanded={all}>
              {all ? (en ? 'Show fewer' : 'عرض أقل') : (en ? 'All ' + dests.length + ' destinations from ' + from.en : 'كل الوجهات من ' + from.ar + ' (' + dests.length + ')')}
              <Icon name={all ? 'chevron-up' : 'chevron-down'} size={18} strokeWidth={2} />
            </button>
          ) : null}

          <p className="qs-fb-note">
            <Icon name="info" size={18} strokeWidth={2} />
            <span>{en
              ? 'Prices are per adult in Iraqi dinars. Iraqi Airways fares are fixed; other airlines start from the price shown and change with the travel date and seat availability. Last updated ' + updatedLabel(FARES_UPDATED, true) + '.'
              : 'الأسعار للمسافر البالغ بالدينار العراقي. أسعار الخطوط الجوية العراقية ثابتة، وأسعار بقية الشركات تبدأ من المبلغ المعروض وتتغيّر حسب تاريخ السفر وتوفّر المقاعد. آخر تحديث ' + updatedLabel(FARES_UPDATED, false) + '.'}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
