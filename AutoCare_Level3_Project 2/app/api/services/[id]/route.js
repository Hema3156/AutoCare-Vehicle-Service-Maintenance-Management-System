import { query } from '@/lib/db';
import { route, ok, fail, body, int, num } from '@/lib/api';

export const PATCH = route(['Admin'], async (req, { params }) => {
  const b = await body(req); const price = num(b.base_price);
  if (!Number.isFinite(price) || price < 0) return fail('Valid price required');
  await query('UPDATE SERVICE_TYPE SET Base_Price=? WHERE Service_ID=?', [price.toFixed(2), int(params.id)]);
  return ok({ ok: true });
});

// FK ON DELETE RESTRICT makes the DB refuse deletion of services that have appointments
export const DELETE = route(['Admin'], async (req, { params }) => {
  await query('DELETE FROM SERVICE_TYPE WHERE Service_ID=?', [int(params.id)]);
  return ok({ ok: true });
});
