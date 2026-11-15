'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { getRate, loadRate } from '../../lib/currency';
import { waLink } from '../../lib/whatsapp';
import { ORIGINS, FARES_UPDATED, destinationsFrom } from '../../lib/flightFares';

// "Fares from your city", laid out the way a customer decides: where am I
// leaving from, what kind of ticket, where to, then which flight. The three
// choices sit at the top; the destinations are a list; one destination shows
// its flights as plain rows (airline, time, days, price, book). On wide
// screens the flights sit beside the list, on phones they open under the row.
// Seat availability and business fares are not in the flights sheet, so
// business reads "on request" and every flight books through WhatsApp.
//
// `initial` rows are shown before "show all"; `link` adds the header link to
// the flights page (used on the homepage only).

const num = (n) => Number(n).toLocaleString('en-US');

function updatedLabel(ymd, en) {
  try {
    return new Intl.DateTimeFormat(en ? 'en-GB' : 'ar-IQ-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(ymd + 'T00:00:00Z'));
  } catch { return ymd; }
}

function flightMessage({ origin, dest, carrier, trip, cabin, price, en }) {
  const biz = cabin === 'biz';
  const tripText = trip === 'round' ? (en ? 'Round trip' : 'ذهاب وعودة') : (en ? 'One way' : 'ذهاب فقط');
  return en
    ? ['Hello, I would like to book this flight:', '✈️ ' + origin.en + ' to ' + dest.en + ' with ' + carrier.en, 'Trip: ' + tripText, 'Class: ' + (biz ? 'Business' : 'Economy'), biz ? 'What is the business fare?' : 'Website price: IQD ' + num(price)].join('\n')
    : ['مرحباً، أرغب بحجز هذه الرحلة:', '✈️ من ' + origin.ar + ' إلى ' + dest.ar + ' على ' + carrier.ar, 'نوع الرحلة: ' + tripText, 'الدرجة: ' + (biz ? 'رجال الأعمال' : 'السياحية'), biz ? 'كم سعر درجة رجال الأعمال؟' : 'السعر في الموقع: ' + num(price) + ' د.ع'].join('\n');
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

// The sheet keeps 24-hour times; customers read a 12-hour clock.
function clock12(times, en) {
  return String(times).replace(/(\d{1,2}):(\d{2})/g, (_, h, m) => {
    const hour = Number(h);
    return (hour % 12 || 12) + ':' + m + ' ' + (hour < 12 ? (en ? 'AM' : 'ص') : (en ? 'PM' : 'م'));
  });
}

// Live seats and fares for a chosen date are on the Flamingo booking site (the
// platform our bookings are made on). This builds its search link.
const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
function liveSearchUrl({ fromCode, toCode, go, back, trip, cabin }) {
  const q = new URLSearchParams();
  q.set('departureAirportCode', fromCode);
  q.set('arrivalAirportCode', toCode);
  q.set('departureDate', go + 'T00:00:00.000Z');
  if (trip === 'round' && back) q.set('returnDate', back + 'T00:00:00.000Z');
  q.set('flightType', trip === 'round' && back ? 'RoundTrip' : 'OneWay');
  q.set('cabinType', cabin === 'biz' ? '2' : '1');
  q.set('passengers', JSON.stringify([{ type: 0, count: 1 }]));
  return 'https://flamingo.iq/flight-booking?' + q.toString();
}

function LiveSearch({ d, from, trip, cabin, en }) {
  const [go, setGo] = useState('');
  const [back, setBack] = useState('');
  const [min, setMin] = useState('');
  // Dates are set after mount so the server and the browser render the same markup.
  useEffect(() => { setMin(plusDays(0)); setGo(plusDays(7)); setBack(plusDays(14)); }, []);
  const city = d.key.toUpperCase();
  const toCode = (d.offers.find((f) => f.to === city) || d.offers[0]).to;
  const ready = go && (trip !== 'round' || (back && back >= go));
  const pickGo = (v) => { setGo(v); if (back && v && back < v) setBack(v); };
  return (
    <div className="qs-fb-live">
      <p className="qs-fb-livet">{en ? 'Seats and prices on your travel date' : 'المقاعد والأسعار بتاريخ سفرك'}</p>
      <div className="qs-fb-liverow">
        <label>
          <small>{en ? 'Departure date' : 'تاريخ الذهاب'}</small>
          <input type="date" value={go} min={min} onChange={(e) => pickGo(e.target.value)} />
        </label>
        {trip === 'round' ? (
          <label>
            <small>{en ? 'Return date' : 'تاريخ العودة'}</small>
            <input type="date" value={back} min={go || min} onChange={(e) => setBack(e.target.value)} />
          </label>
        ) : null}
        <a className={'qs-fb-livebtn' + (ready ? '' : ' off')} aria-disabled={!ready} href={ready ? liveSearchUrl({ fromCode: from.code, toCode, go, back, trip, cabin }) : undefined} target="_blank" rel="noopener">
          {en ? 'Show available flights' : 'اعرض الرحلات المتوفرة'}
          <Icon name="arrow-up-right" size={16} strokeWidth={2} />
        </a>
      </div>
    </div>
  );
}

// One destination's flights, cheapest first. Rendered beside the list on wide
// screens and under the opened row on phones.
function Flights({ d, from, trip, cabin, rate, en }) {
  const n = d.offers.length;
  const biz = cabin === 'biz';
  const count = en ? n + (n === 1 ? ' flight' : ' flights') : (n === 1 ? 'رحلة واحدة' : n === 2 ? 'رحلتان' : n <= 10 ? n + ' رحلات' : n + ' رحلة');
  const tripText = trip === 'round' ? (en ? 'Round trip' : 'ذهاب وعودة') : (en ? 'One way' : 'ذهاب فقط');
  const cabinText = biz ? (en ? 'Business' : 'رجال الأعمال') : (en ? 'Economy' : 'السياحية');
  return (
    <div className="qs-fb-flights">
      <p className="qs-fb-leg">
        <b>{en ? from.en + ' to ' + d.place.en : 'من ' + from.ar + ' إلى ' + d.place.ar}</b>
        <span>{[count, tripText, cabinText].join(' · ')}</span>
      </p>
      <LiveSearch d={d} from={from} trip={trip} cabin={cabin} en={en} />
      <p className="qs-fb-listt">{en ? 'Weekly schedule and starting prices' : 'الجدول الأسبوعي والأسعار التقريبية'}</p>
      <ul>
        {d.offers.map((f, k) => {
          const legs = [{ id: 'go', name: en ? 'Departs' : 'الذهاب', time: f.time, days: en ? f.daysEn : f.daysAr }];
          if (trip === 'round') legs.push({ id: 'back', name: en ? 'Returns' : 'العودة', time: f.backTime, days: en ? f.backDaysEn : f.backDaysAr });
          return (
            <li key={k} className="qs-fb-flight">
              <div className="qs-fb-fcar">
                {f.carrier.logo ? (
                  <span className="qs-fb-mark">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={'/assets/airlines-color/' + f.carrier.logo + '.webp'} alt="" loading="lazy" decoding="async" />
                  </span>
                ) : (
                  <span className="qs-fb-mark qs-fb-tail" aria-hidden="true">{en ? f.carrier.en : (f.carrier.shortAr || f.carrier.ar)}</span>
                )}
                <span className="qs-fb-carrier">
                  <span>{en ? f.carrier.en : f.carrier.ar}</span>
                  {f.place.airportAr ? <small>{en ? f.place.airportEn : f.place.airportAr}</small> : null}
                </span>
              </div>
              <div className="qs-fb-times">
                {legs.map((l) => (
                  <p key={l.id}>
                    <small>{l.name}</small>
                    <b>{l.time ? clock12(l.time, en) : (en ? 'Time varies by day' : 'الوقت حسب اليوم')}</b>
                    {l.days ? <span>{l.days}</span> : null}
                  </p>
                ))}
              </div>
              {biz
                ? <span className="qs-fb-price qs-fb-onask"><span className="qs-fb-amount"><b>{en ? 'Price on request' : 'السعر عند الطلب'}</b></span></span>
                : <Price value={f.price} en={en} label={f.carrier.fixed ? '' : (en ? 'From' : 'يبدأ من')} />}
              <a className="qs-fb-book" href={waLink(flightMessage({ origin: from, dest: d.place, carrier: f.carrier, trip, cabin, price: f.price, en }))} target="_blank" rel="noopener">
                <Icon name="message-circle" size={16} strokeWidth={2} />
                {biz ? (en ? 'Ask for the fare' : 'اطلب السعر') : (en ? 'Book' : 'احجز')}
              </a>
            </li>
          );
        })}
      </ul>
      <p className="qs-fb-help">{en ? 'Booking is completed on WhatsApp, or call ' : 'الحجز يكتمل عبر واتساب، أو اتصل على '}<a href="tel:6393">6393</a></p>
    </div>
  );
}

export default function FareBoard({ lang = 'ar', initial = 8, link = true }) {
  const en = lang === 'en';
  const [origin, setOrigin] = useState(ORIGINS[0].code);
  const [trip, setTrip] = useState('one');
  const [open, setOpen] = useState('');
  const [all, setAll] = useState(false);
  const [cabin, setCabin] = useState('eco'); // 'eco' | 'biz'. The sheet has economy fares only.
  const [rate, setRate] = useState(getRate());

  useEffect(() => { let alive = true; loadRate().then((r) => { if (alive) setRate(r); }); return () => { alive = false; }; }, []);

  const from = ORIGINS.find((o) => o.code === origin) || ORIGINS[0];
  const dests = useMemo(() => destinationsFrom(origin, trip, rate), [origin, trip, rate]);
  const shown = all ? dests : dests.slice(0, initial);
  // Beside the list there is always a destination on show: the chosen one, or the first.
  const side = dests.find((d) => d.key === open) || dests[0];

  const pickOrigin = (code) => { setOrigin(code); setOpen(''); setAll(false); };

  return (
    <section id="fares" className="qs-band qs-fb-band" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div className="qs-head">
          <div>
            <span className="qs-kicker">{en ? 'Flights' : 'الطيران'}</span>
            <h2 className="qs-h2">{en ? 'Ticket prices from your city' : 'أسعار التذاكر من مدينتك'}</h2>
            <p className="qs-lead">{en
              ? 'Choose your city and your destination to see the flights, their times and their prices.'
              : 'اختر مدينتك ثم وجهتك لتشاهد الرحلات وأوقاتها وأسعارها.'}</p>
          </div>
          {link ? <Link href="/flights" className="qs-link">{en ? 'Flight booking' : 'حجز الطيران'}</Link> : null}
        </div>

        <div className="qs-fb">
          <div className="qs-fb-step">
            <p className="qs-fb-q">{en ? 'Leaving from' : 'المغادرة من'}</p>
            <div className="qs-fb-origins" role="tablist" aria-label={en ? 'Departure city' : 'مدينة المغادرة'}>
              {ORIGINS.map((o) => (
                <button key={o.code} type="button" role="tab" aria-selected={o.code === origin} className="qs-fb-origin" onClick={() => pickOrigin(o.code)}>{en ? o.en : o.ar}</button>
              ))}
            </div>
          </div>

          <div className="qs-fb-bar">
            <div className="qs-fb-opt">
              <p className="qs-fb-q">{en ? 'Trip' : 'نوع الرحلة'}</p>
              <div className="qs-fb-seg" role="group" aria-label={en ? 'Trip type' : 'نوع الرحلة'}>
                <button type="button" aria-pressed={trip === 'one'} onClick={() => setTrip('one')}>{en ? 'One way' : 'ذهاب فقط'}</button>
                <button type="button" aria-pressed={trip === 'round'} onClick={() => setTrip('round')}>{en ? 'Round trip' : 'ذهاب وعودة'}</button>
              </div>
            </div>
            <div className="qs-fb-opt">
              <p className="qs-fb-q">{en ? 'Class' : 'الدرجة'}</p>
              <div className="qs-fb-seg" role="group" aria-label={en ? 'Cabin class' : 'درجة السفر'}>
                <button type="button" aria-pressed={cabin === 'eco'} onClick={() => setCabin('eco')}>{en ? 'Economy' : 'السياحية'}</button>
                <button type="button" aria-pressed={cabin === 'biz'} onClick={() => setCabin('biz')}>{en ? 'Business' : 'رجال الأعمال'}</button>
              </div>
            </div>
          </div>

          <div className="qs-fb-body">
            <div className="qs-fb-side">
              <p className="qs-fb-q qs-fb-qlist">{en ? 'Going to' : 'الوجهة'}</p>
              <ol className="qs-fb-list" key={origin}>
                {shown.map((d) => {
                  const isOpen = open === d.key;
                  const n = d.offers.length;
                  const sub = [en ? d.place.countryEn : d.place.countryAr, en ? n + (n === 1 ? ' flight' : ' flights') : (n === 1 ? 'رحلة واحدة' : n === 2 ? 'رحلتان' : n <= 10 ? n + ' رحلات' : n + ' رحلة')].join(' · ');
                  return (
                    <li key={d.key} className={'qs-fb-item' + (isOpen ? ' open' : '') + (side && side.key === d.key ? ' sel' : '')}>
                      <button type="button" className="qs-fb-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : d.key)}>
                        <span className="qs-fb-dest">
                          <span className="qs-fb-name">{en ? d.place.en : d.place.ar}</span>
                          <small>{sub}</small>
                        </span>
                        {cabin === 'biz' ? null : <Price value={d.from} en={en} label={en ? 'From' : 'يبدأ من'} />}
                        <Icon name="chevron-down" size={18} strokeWidth={2} className="qs-fb-chev" />
                      </button>
                      {isOpen ? <div className="qs-fb-inline"><Flights d={d} from={from} trip={trip} cabin={cabin} rate={rate} en={en} /></div> : null}
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
            </div>
            <div className="qs-fb-panel" aria-live="polite">
              {side ? <Flights key={side.key + trip} d={side} from={from} trip={trip} cabin={cabin} rate={rate} en={en} /> : null}
            </div>
          </div>

          <p className="qs-fb-note">
            <Icon name="info" size={18} strokeWidth={2} />
            <span>{en
              ? 'Prices are per adult in Iraqi dinars and may change with the travel date and seat availability. Last updated ' + updatedLabel(FARES_UPDATED, true) + '.'
              : 'الأسعار للمسافر البالغ بالدينار العراقي، وقد تتغيّر حسب تاريخ السفر وتوفّر المقاعد. آخر تحديث ' + updatedLabel(FARES_UPDATED, false) + '.'}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
