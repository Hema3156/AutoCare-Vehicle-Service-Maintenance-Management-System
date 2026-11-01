import { query, pool, callWithOut } from '@/lib/db';
import { body, need, route, HttpError, int } from '@/lib/api';
import { logActivity } from '@/lib/mongo';

export const dynamic = 'force-dynamic';
const STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

export const GET = route([], async (req, ctx, s) => {
  const sp = new URL(req.url).searchParams;
  const where = [], p = [];
  if (s.role === 'Customer') { where.push('d.Customer_ID = ?'); p.push(s.customerId); }
  if (sp.get('mine') && s.staffId) { where.push('d.Staff_ID = ?'); p.push(s.staffId); }
  const st = sp.get('status');
  if (st) { if (!STATUSES.includes(st)) throw new HttpError(400, 'Invalid status'); where.push('d.Status = ?'); p.push(st); }
  if (sp.get('from')) { where.push('d.Appointment_DateTime >= ?'); p.push(sp.get('from')); }
  if (sp.get('to')) { where.push('d.Appointment_DateTime < DATE_ADD(?, INTERVAL 1 DAY)'); p.push(sp.get('to')); }
  const q = sp.get('q')?.trim();
  if (q) { where.push('(d.Registration_No LIKE ? OR d.Customer_Name LIKE ? OR d.Service_Name LIKE ?)'); p.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  return query(
    `SELECT d.*, i.Invoice_ID, i.Status AS Invoice_Status, i.Total_Amount
       FROM vw_appointment_details d LEFT JOIN INVOICE i ON i.Appointment_ID = d.Appointment_ID
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY d.Appointment_DateTime DESC`, p);
});

// Booking runs inside the stored procedure sp_book_appointment (transaction + clash check)
export const POST = route([], async (req, ctx, s) => {
  const b = await body(req);
  need(b, ['vehicleId', 'serviceId', 'dateTime']);
  const vehicleId = int(b.vehicleId, 'vehicleId');
  const [v] = await query('SELECT Customer_ID FROM VEHICLE WHERE Vehicle_ID = ?', [vehicleId]);
  if (!v) throw new HttpError(404, 'Vehicle not found');
  if (s.role === 'Customer' && v.Customer_ID !== s.customerId) throw new HttpError(403, 'Not your vehicle');
  const dt = String(b.dateTime).replace('T', ' ').slice(0, 16) + ':00';
  if (!/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(dt)) throw new HttpError(400, 'Invalid date/time');
  const conn = await pool.getConnection();
  try {
    const id = await callWithOut(conn, 'sp_book_appointment(?,?,?,?,?,@out)',
      [vehicleId, int(b.serviceId, 'serviceId'), b.staffId ? int(b.staffId, 'staffId') : null, dt, b.problem || null]);
    logActivity(s, 'book_appointment', { appointmentId: id });
    return { id };
  } finally { conn.release(); }
});
