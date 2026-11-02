import { withConnection, query } from '@/lib/db';
import { route, ok, fail, body, str, int } from '@/lib/api';
import { audit } from '@/lib/mongo';

export const GET = route(null, async (req, ctx, s) => {
  const sp = new URL(req.url).searchParams;
  const where = [], p = [];
  if (s.role === 'Customer') { where.push('Customer_ID=?'); p.push(s.customerId); }
  if (s.role === 'Staff') { where.push('Staff_ID=?'); p.push(s.staffId); }
  if (sp.get('status')) { where.push('Status=?'); p.push(sp.get('status')); }
  const rows = await query(`SELECT * FROM v_appointment_details ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY Appointment_DateTime DESC LIMIT 200`, p);
  return ok({ appointments: rows });
});

export const POST = route(['Customer', 'Admin', 'Staff'], async (req, ctx, s) => {
  const b = await body(req);
  const vehicleId = int(b.vehicle_id), serviceId = int(b.service_id);
  let staffId = s.role === 'Customer' ? null : int(b.staff_id);
  if (!vehicleId || !serviceId) return fail('Vehicle and service are required');
  if (!b.datetime) return fail('Date and time are required');
  if (s.role === 'Customer') {
    const own = await query('SELECT 1 FROM VEHICLE WHERE Vehicle_ID=? AND Customer_ID=?', [vehicleId, s.customerId]);
    if (!own.length) return fail('Forbidden', 403);
  }
  const dt = String(b.datetime).replace('T', ' ').slice(0, 16) + ':00';
  if (Number.isNaN(Date.parse(String(b.datetime)))) return fail('Invalid date');
  const id = await withConnection(async (c) => {
    await c.query('CALL sp_book_appointment(?,?,?,?,?,@id)', [vehicleId, serviceId, staffId, dt, str(b.problem, 1000) || null]);
    const [[r]] = await c.query('SELECT @id AS id');
    return r.id;
  });
  audit(s.name, 'book_appointment', 'APPOINTMENT', { id });
  return ok({ id }, 201);
});
