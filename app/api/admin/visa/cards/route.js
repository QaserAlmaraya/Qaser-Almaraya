import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/session';
import { getExchangeRate } from '../../../../../lib/settings';
import { visaFollowsRate, withVisaSellPrices } from '../../../../../lib/visaPricing';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const cards = await sql`
    SELECT vc.*, c.name_ar AS country_name_ar, c.name_en AS country_name_en,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en,
           p.name AS provider_name
    FROM visa_cards vc
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    LEFT JOIN providers p ON p.id = vc.provider_id
    ORDER BY vc.created_at DESC
  `;
  const docs = await sql`SELECT * FROM visa_documents ORDER BY sort_order ASC, id ASC`;
  // An IQD card whose cost is in USD is shown at today's exchange rate, the
  // same price the customer sees, and saving it stamps today's rate
  // (price_rate), so the dashboard and the site always agree.
  const rate = await getExchangeRate();
  const cardsWithDocs = cards.map((c) => ({
    ...(visaFollowsRate(c) ? { ...withVisaSellPrices(c, rate), price_rate: rate } : c),
    documents: docs.filter((d) => d.visa_card_id === c.id),
  }));
  return NextResponse.json(cardsWithDocs);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  // The IQD price is entered at today's rate (see lib/visaPricing.js).
  const priceRate = await getExchangeRate();
  const rows = await sql`
    INSERT INTO visa_cards (
      country_id, visa_type_id, stay_duration, issuing_time_days, validity_before_travel,
      adult_price, child_price, price_currency, price_rate, adult_cost, child_cost, cost_currency, booking_notes, booking_notes_en, image_url,
      provider_id, provider_email, send_method, active
    ) VALUES (
      ${b.country_id || null}, ${b.visa_type_id || null}, ${b.stay_duration || ''}, ${b.issuing_time_days || null},
      ${b.validity_before_travel || ''}, ${b.adult_price || 0}, ${b.child_price || 0}, ${b.price_currency === 'USD' ? 'USD' : 'IQD'}, ${priceRate}, ${b.adult_cost || 0},
      ${b.child_cost || 0}, ${b.cost_currency || 'IQD'}, ${b.booking_notes || ''}, ${b.booking_notes_en || ''}, ${b.image_url || ''}, ${b.provider_id || null},
      ${b.provider_email || ''}, ${b.send_method || 'provider'}, ${b.active !== false}
    ) RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
