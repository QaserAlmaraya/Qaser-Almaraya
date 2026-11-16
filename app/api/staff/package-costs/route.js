import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAuth } from '../../../../lib/session';
import { getExchangeRate } from '../../../../lib/settings';
import { toIqd } from '../../../../lib/costMargin';

// GET only — this route intentionally has no POST/PUT/DELETE. It exists so
// staff accounts can see the internal cost side of package pricing without
// being able to change anything here or anywhere else.
export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`
    SELECT id, title_ar, title_en, dest_ar, dest_en, price, child_price, price_currency, adult_cost, child_cost, cost_currency, active
    FROM packages
    ORDER BY dest_ar ASC NULLS LAST, id ASC
  `;
  // Price and cost can be in different currencies; the margin is always in IQD.
  const rate = await getExchangeRate();
  return NextResponse.json(rows.map((r) => ({
    ...r,
    price_currency: r.price_currency || 'IQD',
    adult_margin_iqd: toIqd(r.price, r.price_currency, rate) - toIqd(r.adult_cost, r.cost_currency, rate),
  })));
}
