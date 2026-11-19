// Visa selling prices.
//
// A visa card's adult/child selling price is stored in one of two ways:
//
// 1. USD (price_currency = 'USD'): the whole price is converted with the
//    dashboard's exchange rate on every read and rounded to the nearest
//    1,000 IQD — exactly like a package priced in USD.
//
// 2. IQD (price_currency = 'IQD', how almost every card is stored). The IQD
//    price was worked out from a USD cost at the rate of that day:
//      price = cost_USD × rate_then + commission
//    `price_rate` remembers that rate. When the dashboard rate changes, only
//    the cost part moves and the commission stays as it was:
//      price_now = price + cost_USD × (rate_now − price_rate)
//    rounded UP to the next 1,000 IQD, so rounding can never eat into the
//    commission. Changing the rate in الإعدادات therefore moves visa prices
//    just like group prices, with no per-card editing. A card whose cost is
//    in IQD (or has no cost) keeps its fixed IQD price.
//
// None of the internal fields (price_currency, costs, cost_currency,
// price_rate) may reach the customer — use publicVisaCard() for that.
import { round1000 } from './packagePricing';

const n = (v) => Number(v) || 0;
// Up to the next 1,000 IQD (a whole-thousand price stays as it is).
const ceil1000 = (v) => Math.ceil(Math.round(n(v)) / 1000) * 1000;

/** The rate every IQD card price was entered at before price_rate existed. */
export const VISA_BASE_RATE = 1700;

export function visaPricedInUsd(card) { return !!card && card.price_currency === 'USD'; }

/** An IQD-priced card whose cost is in USD: its price follows the rate. */
export function visaFollowsRate(card) {
  return !!card && !visaPricedInUsd(card) && card.cost_currency === 'USD';
}

/** The rate this card's IQD prices were entered at. */
export function visaPriceRate(card) {
  return n(card && card.price_rate) || VISA_BASE_RATE;
}

/**
 * The customer price in IQD for one stored price.
 * @param value the stored adult_price or child_price
 * @param cost  the matching adult_cost or child_cost
 */
export function visaPriceIqd(card, value, rate = 1, cost = 0) {
  const r = n(rate) || 1;
  if (visaPricedInUsd(card)) return round1000(n(value) * r);
  const price = n(value);
  if (!visaFollowsRate(card) || price <= 0 || n(cost) <= 0) return price;
  const delta = r - visaPriceRate(card);
  if (!delta) return price;
  return ceil1000(price + n(cost) * delta);
}

/** The card with adult_price / child_price in IQD at today's rate. */
export function withVisaSellPrices(card, rate = 1) {
  if (!card) return card;
  return {
    ...card,
    adult_price: visaPriceIqd(card, card.adult_price, rate, card.adult_cost),
    child_price: visaPriceIqd(card, card.child_price, rate, card.child_cost),
  };
}

/** Customer-safe copy: IQD prices only, no cost, currency or rate fields. */
export function publicVisaCard(card, rate = 1) {
  if (!card) return card;
  // eslint-disable-next-line no-unused-vars
  const { price_currency, adult_cost, child_cost, cost_currency, price_rate, ...safe } = withVisaSellPrices(card, rate);
  return safe;
}
