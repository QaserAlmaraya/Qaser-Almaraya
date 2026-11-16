// Internal cost screens: convert one stored amount to IQD with the dashboard
// exchange rate, so a selling price and a cost kept in different currencies
// can be compared (staff «التكاليف» tab).
export function toIqd(value, currency, rate = 1) {
  const v = Number(value) || 0;
  return currency === 'USD' ? Math.round(v * (Number(rate) || 1)) : v;
}
