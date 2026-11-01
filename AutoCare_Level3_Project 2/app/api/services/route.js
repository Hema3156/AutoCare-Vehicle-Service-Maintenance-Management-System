import { query } from '@/lib/db';
import { route, ok, fail, body, str, int, num } from '@/lib/api';

export const GET = route(null, async () => ok({ services: await query('SELECT * FROM SERVICE_TYPE ORDER BY Service_Name') }));

export const POST = route(['Admin'], async (req) => {
  const b = await body(req);
  const name = str(b.service_name, 100), price = num(b.base_price);
  if (!name || !Number.isFinite(price) || price < 0) return fail('Name and a valid price are required');
  const r = await query('INSERT INTO SERVICE_TYPE (Service_Name,Description,Base_Price,Estimated_Duration,Warranty_Days) VALUES (?,?,?,?,?)',
    [name, str(b.description, 1000) || null, price.toFixed(2), int(b.estimated_duration), int(b.warranty_days) || 0]);
  return ok({ id: r.insertId }, 201);
});
