import { query, withConnection } from '@/lib/db';
import { route, ok, fail, body, int, num } from '@/lib/api';
import { audit } from '@/lib/mongo';
import crypto from 'node:crypto';

export const POST = route(['Customer', 'Admin', 'Staff'], async (req, ctx, s) => {
  const b = await body(req);
  const apptId = int(b.appointment_id), amount = num(b.amount);
  const method = b.method;
  if (!apptId) return fail('Appointment is required');
  if (!Number.isFinite(amount) || amount <= 0) return fail('Amount must be greater than zero');
  if (!['Cash', 'Card', 'UPI', 'NetBanking'].includes(method)) return fail('Choose a valid payment method');
  if (s.role === 'Customer') {
    const own = await query('SELECT 1 FROM v_appointment_details WHERE Appointment_ID=? AND Customer_ID=?', [apptId, s.customerId]);
    if (!own.length) return fail('Forbidden', 403);
  }
  const ref = 'TXN-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  await withConnection((c) => c.query('CALL sp_record_payment(?,?,?,?)', [apptId, amount.toFixed(2), method, ref]));
  audit(s.name, 'payment', 'PAYMENT', { apptId, amount, ref });
  return ok({ ref }, 201);
});
