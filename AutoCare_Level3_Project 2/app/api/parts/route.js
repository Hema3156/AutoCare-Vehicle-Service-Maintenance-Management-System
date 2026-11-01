import { query, withConnection } from '@/lib/db';
import { route, ok, fail, body, str, int, num } from '@/lib/api';
import { audit } from '@/lib/mongo';

export const GET = route(['Admin', 'Staff'], async () => ok({ parts: await query('SELECT * FROM SPARE_PART ORDER BY Part_Name') }));

export const POST = route(['Admin', 'Staff'], async (req, ctx, s) => {
  const b = await body(req);
  if (b.action === 'restock') {
    const qty = int(b.quantity), id = int(b.part_id);
    if (!id || !qty || qty < 1) return fail('Part and positive quantity are required');
    await withConnection((c) => c.query('CALL sp_restock_part(?,?)', [id, qty]));
    audit(s.name, 'restock', 'SPARE_PART', { id, qty });
    return ok({ ok: true });
  }
  if (s.role !== 'Admin') return fail('Only admins can add new parts', 403);
  const name = str(b.part_name, 100), price = num(b.unit_price);
  if (!name || !Number.isFinite(price) || price < 0) return fail('Name and valid price are required');
  const r = await query('INSERT INTO SPARE_PART (Part_Name,Part_Number,Stock_Qty,Unit_Price,Reorder_Level,Last_Restocked) VALUES (?,?,?,?,?,NOW())',
    [name, str(b.part_number, 60) || null, int(b.stock_qty) || 0, price.toFixed(2), int(b.reorder_level) || 0]);
  return ok({ id: r.insertId }, 201);
});
