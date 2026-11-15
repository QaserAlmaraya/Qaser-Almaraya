'use client';
import Link from 'next/link';
import Icon from '../Icon';
import HomeFold from './HomeFold';

// "Why Al Maraya", told as the questions a traveller from Iraq asks before
// booking and how the company answers each one. Every answer restates a fact
// the site already carries elsewhere: the services list, the licence number
// in the footer, the Flamingo partnership, the Baghdad office and the hotline.
// No invented numbers.
const POINTS = [
  { icon: 'stamp', href: '/visa',
    qAr: 'ما المستندات التي تحتاجها التأشيرة، وكم تستغرق؟', qEn: 'Which documents does the visa need, and how long does it take?',
    aAr: 'لكل دولة قائمة بالمستندات المطلوبة ومدة الإصدار والسعر، ونتابع طلبك حتى الإصدار.', aEn: 'Each country has its list of documents, processing time and price, and we follow your application until it is issued.',
    goAr: 'التأشيرات', goEn: 'Visas' },
  { icon: 'luggage', href: '/packages',
    qAr: 'من يرتب الطيران والفندق والتأشيرة معاً؟', qEn: 'Who arranges the flight, the hotel and the visa together?',
    aAr: 'طلب واحد لدى مكتبنا في بغداد يشمل الطيران والفندق والتأشيرة، ويتابعه فريق واحد من أول اتصال حتى انتهاء الرحلة.', aEn: 'One request at our Baghdad office covers the flight, the hotel and the visa, and one team follows it from the first call to the end of the trip.',
    goAr: 'الباقات السياحية', goEn: 'Holiday packages' },
  { icon: 'banknote', href: '#prices',
    qAr: 'ما الذي يشمله السعر؟', qEn: 'What does the price include?',
    aAr: 'الباقات بسعر واحد للفرد يشمل الطيران والفندق والجولات، وأسعار التذاكر معروضة بالدينار العراقي من مطار مغادرتك.', aEn: 'Packages come at one price per person covering flights, hotel and tours, and ticket prices are shown in Iraqi dinars from the airport you leave from.',
    goAr: 'العروض والأسعار', goEn: 'Offers and prices' },
  { icon: 'shield-check', href: '#contact',
    qAr: 'مع من أتعامل، وأين أجده؟', qEn: 'Who am I dealing with, and where do I find them?',
    aAr: 'شركة عراقية مجازة، رقم الإجازة 784. مكتبنا في شارع 14 رمضان ببغداد، والرقم المختصر 6393 داخل العراق.', aEn: 'A licensed Iraqi company, licence no. 784. Our office is on 14 Ramadan Street in Baghdad, and the hotline is 6393 inside Iraq.',
    goAr: 'تواصل معنا', goEn: 'Contact us' },
];

// English names for the company's milestones (the Arabic comes from the
// ACHIEVEMENTS list in Site.jsx, the same one the About page shows).
const MILE_EN = {
  forum: 'Travel & Tourism Companies Forum, Baghdad International Fair',
  fitur: 'FITUR travel fair, Madrid',
  turkish: 'Recognition from Turkish Airlines',
  salam: 'Recognition from SalamAir',
  fans: 'Flying the national team’s fans',
};

function Go({ href, children }) {
  if (href.charAt(0) === '#') return <a className="qs-ps-go" href={href}>{children}</a>;
  return <Link className="qs-ps-go" href={href}>{children}</Link>;
}

export default function HomeWhy({ lang = 'ar' }) {
  const en = lang === 'en';
  return (
    <section className="qs-band qs-ch-top qs-ps-band" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap qs-ps">
        <div className="qs-ps-head">
          <span className="qs-kicker">{en ? 'Why Al Maraya' : 'لماذا قصر المرايا'}</span>
          <h2 className="qs-h2">{en ? 'A travel company you can visit, call and hold to its word' : 'شركة سفر تزورها وتتصل بها وتعرف من يتابع رحلتك'}</h2>
          <p className="qs-lead">{en ? 'Four questions travellers from Iraq ask before they book, and how we answer each one.' : 'أربعة أسئلة يطرحها المسافر من العراق قبل أن يحجز، وكيف نجيب عن كل منها.'}</p>
          <div className="qs-photo qs-ps-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/ach-forum-baghdad.webp" alt={en ? 'Qaser Almaraya at the travel and tourism companies forum, Baghdad International Fair' : 'قصر المرايا في ملتقى شركات السفر والسياحة، معرض بغداد الدولي'} loading="lazy" decoding="async" />
          </div>
        </div>
        <ol className="qs-ps-list">
          {POINTS.map((p) => (
            <li key={p.qEn} className="qs-ps-item">
              <span className="qs-ps-icon"><Icon name={p.icon} size={22} strokeWidth={1.6} /></span>
              <div className="qs-ps-text">
                <h3>{en ? p.qEn : p.qAr}</h3>
                <p>{en ? p.aEn : p.aAr}</p>
                <Go href={p.href}>{en ? p.goEn : p.goAr}<Icon name={en ? 'chevron-right' : 'chevron-left'} size={16} strokeWidth={2} /></Go>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// The company's milestones, folded: they support the trust chapter but are
// not what a customer came for, so they open on request.
export function HomeMilestones({ lang = 'ar', milestones = [] }) {
  const en = lang === 'en';
  const list = milestones.filter((m) => m.id !== 'forum').slice(0, 4); // the forum photo already leads the chapter above
  if (!list.length) return null;
  return (
    <section className="qs-band qs-miles-band" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap">
        <HomeFold
          icon="landmark"
          title={en ? 'Milestones' : 'محطات من مسيرتنا'}
          note={en ? 'Fairs we took part in and recognition from airlines we work with.' : 'معارض شاركنا فيها وتكريمات من شركات طيران نتعامل معها.'}
        >
          <div className="qs-miles">
            {list.map((m) => (
              <figure key={m.id} className="qs-mile">
                <div className="qs-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={'/assets/' + m.photo} alt={en ? MILE_EN[m.id] || m.title : m.title} loading="lazy" decoding="async" />
                </div>
                <figcaption>
                  <b>{m.year}</b>
                  <span>{en ? MILE_EN[m.id] || m.title : m.title}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </HomeFold>
      </div>
    </section>
  );
}
