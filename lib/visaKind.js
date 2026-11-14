// A few "visa" cards are really standalone travel services (international
// driving permit, travel health insurance) that live in the visa catalogue
// for convenience but are NOT visas. They are grouped under this region and
// must never be labelled "تأشيرة" on customer-facing pages.
export const SERVICE_REGION = 'خدمات أخرى';

export function isVisaService(cardOrRegion) {
  const r = typeof cardOrRegion === 'string' ? cardOrRegion : cardOrRegion && cardOrRegion.region;
  return r === SERVICE_REGION;
}
