import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAuth } from '../../../../lib/session';

// Staff-only: the supplier name of each package, shown on the public site
// after a signed-in staff member presses Alt + Q (same mechanism as the visa
// provider hints). The public /api/packages never carries the supplier, and
// nothing here is fetched until the shortcut is pressed. A visitor without a
// staff/admin session just gets a 401. GET only, read only.
export async function GET(request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  await ensureSchema();
  const rows = await sql`
    SELECT p.id, s.name AS supplier_name
    FROM packages p
    LEFT JOIN suppliers s ON s.id = p.supplier_id
  `;
  const out = {};
  rows.forEach((r) => {
    out[r.id] = { supplier_name: r.supplier_name || null };
  });
  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } });
}
