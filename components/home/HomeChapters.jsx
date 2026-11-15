'use client';
import Link from 'next/link';
import CtaButton from '../CtaButton';
import HomeFold from './HomeFold';
import VisaChecker from '../VisaChecker';
import TripFinder from '../TripFinder';

// Small pieces that tie the homepage sections into chapters:
// the heading of the prices chapter, the two planning tools folded into one
// group, and the closing band with the page's primary action.

// Opens the "prices" chapter. The offer stories, the featured offers, the
// departures board and the fares board follow it under one heading.
export function PricesHead({ lang = 'ar' }) {
  const en = lang === 'en';
  return (
    <section className="qs-band qs-ch-top qs-prices-head" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap">
        <div className="qs-head">
          <div>
            <span className="qs-kicker">{en ? 'Prices' : 'الأسعار'}</span>
            <h2 className="qs-h2">{en ? 'Offers and prices' : 'العروض والأسعار'}</h2>
            <p className="qs-lead">{en ? 'Package offers, the next departures and ticket prices from your airport, in one place.' : 'عروض الباقات، وأقرب مواعيد المغادرة، وأسعار التذاكر من مطارك، في مكان واحد.'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// The visa checker and the budget trip finder are planning tools, not the
// first thing a visitor needs, so each one is a folded row: the visa checker
// starts open (it is two fields), the trip finder opens on request.
export function HomeTools({ lang = 'ar' }) {
  const en = lang === 'en';
  return (
    <section className="qs-band qs-tools" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap qs-tools-in">
        <h3 className="qs-h3">{en ? 'Plan before you book' : 'خطّط قبل أن تحجز'}</h3>
        <div className="qs-fold-group">
          <HomeFold
            open
            icon="stamp"
            title={en ? 'Visa checker' : 'فاحص التأشيرة'}
            note={en ? 'Choose where you are going and see the price, processing time and the documents to prepare.' : 'اختر وجهتك واعرف فوراً السعر ومدة الإصدار والمستندات المطلوبة.'}
          >
            <VisaChecker lang={lang} embedded />
          </HomeFold>
          <HomeFold
            icon="wallet"
            title={en ? 'Where can I go on my budget?' : 'إلى أين أسافر بميزانيتي؟'}
            note={en ? 'Pick what suits you and we suggest the closest trips.' : 'اختر ما يناسبك، ونقترح عليك أقرب الرحلات.'}
          >
            <TripFinder lang={lang} embedded />
          </HomeFold>
        </div>
      </div>
    </section>
  );
}

// Closing band: the same primary action as the hero, once more at the end.
export function ClosingCta({ lang = 'ar' }) {
  const en = lang === 'en';
  return (
    <section className="qs-band qs-ch-top qs-dark qs-on-dark qs-closing" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap qs-closing-in">
        <div className="qs-closing-copy">
          <h2 className="qs-h2">{en ? 'Choose your trip from the ready packages' : 'اختر رحلتك من الباقات الجاهزة'}</h2>
          <p className="qs-lead">{en ? 'Ready-made trips from Baghdad, one price per person.' : 'رحلات جاهزة من بغداد بسعر واحد للفرد.'}</p>
        </div>
        <div className="qs-closing-acts">
          <CtaButton href="/packages" size="lg" label="تصفّح الباقات" labelEn="Browse packages" lang={lang} />
          <Link className="qs-link" href="/contact?topic=package">{en ? 'or ask for a tailor-made trip' : 'أو اطلب باقة مصممة لك'}</Link>
        </div>
      </div>
    </section>
  );
}

// The shared primary button, re-exported so the homepage block in Site.jsx
// (a file several people edit) needs no extra import of its own.
export function HomeCta(props) {
  return <CtaButton {...props} />;
}
