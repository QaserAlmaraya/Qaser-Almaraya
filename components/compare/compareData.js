// What the comparison shows for one package. Everything here is read from the
// package as the public list gives it: nothing is guessed, and a field that is
// empty stays empty (the view prints «—» for it).
import { nightsLabel, destinationLabel } from '../../lib/destinations';
import { durationLabel } from '../../lib/packagePricing';
import { upcomingDates } from '../../lib/publicPackages';
import { catLabel } from '../../lib/packagesData';

const text = (v) => String(v == null ? '' : v).trim();
const list = (v) => (Array.isArray(v) ? v : []).map(text).filter(Boolean);

export function compareFacts(p, lang = 'ar') {
  const en = lang === 'en';
  const nm = (ar, e) => text(en && text(e) ? e : ar);
  const price = Number(p.price) > 0 ? Number(p.price) : null;

  const hotels = (Array.isArray(p.hotels) ? p.hotels : [])
    .filter((h) => h && !h.hidden && nm(h.nameAr, h.nameEn))
    .map((h) => ({
      name: nm(h.nameAr, h.nameEn),
      stars: Math.max(0, Math.min(5, Math.round(Number(h.stars) || 0))),
      meals: nm(h.notesAr, h.notesEn),
      // Customer price difference against the first hotel, as on the package page.
      extra: Number(h.extras?.adult ?? h.diff) || 0,
    }));

  const flights = (Array.isArray(p.flights) ? p.flights : [])
    .map((f) => (f ? nm(f.nameAr, f.nameEn) : ''))
    .filter(Boolean);

  return {
    id: String(p.id),
    title: nm(p.title_ar, p.title_en),
    image: p.image_url || '',
    price,
    duration: text(durationLabel(p, lang) || nightsLabel(p, lang)),
    destination: text(destinationLabel(p, lang)),
    type: text(catLabel(p.cat, lang)),
    departs: nm(p.departs_ar, p.departs_en),
    dates: upcomingDates(p),
    hotels,
    flights,
    includes: list(en && list(p.includes_en).length ? p.includes_en : p.includes_ar),
    excludes: list(en && list(p.excludes_en).length ? p.excludes_en : p.excludes_ar),
  };
}

export function formatDay(iso, lang) {
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'ar-IQ-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
  } catch {
    return iso;
  }
}
