// ─────────────────────────────────────────────────────────────────────────
// Quick price calculator (the «احسب السعر» panel on the package list).
//
// Pure helpers only. Every number comes from lib/packagePricing.js — the same
// computeTotals() call the package page (app/packages/[id]/page.jsx) makes:
//   computeTotals(pkg, counts, hotels[hotelIdx], flights[flightIdx], dates[dateIdx])
// The package handed in is the PUBLIC one (publicPackage): hotels already
// carry customer prices in IQD, with no settlement / commission / USD fields.
// Nothing here reads cost or profit.
// ─────────────────────────────────────────────────────────────────────────
import { TRAVELLER_TYPES, computeTotals, hotelPrices } from './packagePricing';

// Same starting point as the package page.
export const DEFAULT_COUNTS = { adult: 2, single: 0, childBed: 0, childNoBed: 0, infant: 0 };

const list = (v) => (Array.isArray(v) ? v : []);

/** Hotels, flights and dates in the same order (and with the same indexes) as the package page. */
export function calcOptions(pkg) {
  return {
    hotels: list(pkg && pkg.hotels).filter((h) => h && !h.hidden),
    flights: list(pkg && pkg.flights),
    dates: list(pkg && pkg.available_dates),
  };
}

/**
 * Totals for a selection: { priceable, types, counts, lines, units, total, hotel, flight, date }.
 * - `types`  traveller types this hotel really prices (a missing or zero price is never shown)
 * - `counts` the given counts with un-priced types forced to 0
 * - `priceable` false → the panel shows «السعر عند الطلب» instead of a number
 */
export function calcQuote(pkg, sel) {
  const { hotels, flights, dates } = calcOptions(pkg);
  const hotel = hotels[(sel && sel.hotelIdx) || 0];
  const flight = flights[(sel && sel.flightIdx) || 0];
  const date = dates[(sel && sel.dateIdx) || 0] || null;
  const base = hotel ? hotelPrices(pkg || {}, hotel).prices : null;
  const open = computeTotals(pkg || {}, null, hotel, flight, date); // units only
  // Older packages store 0 (not "empty") for a type they never priced, and a
  // dearer hotel then adds its difference on top of that 0. Such a figure is
  // not a real price, so a type the first hotel carries at 0 stays hidden.
  const first = hotels[0] ? hotelPrices(pkg || {}, hotels[0]).prices : null;
  const types = base
    ? TRAVELLER_TYPES.filter((t) => Number(base[t.key]) > 0 && Number(open.units[t.key]) > 0 && !(first && first[t.key] === 0))
    : [];
  const priceable = types.some((t) => t.key === 'adult');
  const counts = {};
  for (const t of TRAVELLER_TYPES) {
    const ok = priceable && types.includes(t);
    counts[t.key] = ok ? Math.max(0, Math.round(Number(sel && sel.counts && sel.counts[t.key]) || 0)) : 0;
  }
  const totals = computeTotals(pkg || {}, counts, hotel, flight, date);
  return {
    priceable,
    types: priceable ? types : [],
    counts,
    lines: priceable ? totals.lines : [],
    units: totals.units,
    total: priceable ? totals.total : 0,
    hotel: hotel || null,
    flight: flight || null,
    date,
  };
}
