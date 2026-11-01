import { query } from '@/lib/db';
import { body, route, HttpError, int } from '@/lib/api';
import { logActivity } from '@/lib/mongo';
import { loadAppointment } from '@/lib/appointments';

export const dynamic = 'force-dynamic';
export const GET = route([], async (req, { params }, s) => {
  const appointment = await loadAppointment(params.id, s);
  const [record] = await query('SELECT *, fn_warranty_expiry(Appointment_ID) AS Warranty_Until FROM SERVICE_RECORD WHERE Appointment_ID = ?', [params.id]);
  const parts = record ? await query(
    `SELECT sp.Part_ID, p.Part_Name, sp.Quantity, sp.Unit_Cost, sp.Quantity*sp.Unit_Cost AS Line_Total
       FROM SERVICE_PART sp JOIN SPARE_PART p ON p.Part_ID = sp.Part_ID WHERE sp.Service_Record_ID = ?`, [record.Service_Record_ID]) : [];
  const [invoice] = await query('SELECT * FROM vw_invoice_balance WHERE Appointment_ID = ?', [params.id]);
  const [inv2] = invoice ? await query('SELECT Subtotal, Tax FROM INVOICE WHERE Appointment_ID = ?', [params.id]) : [];
  const payments = await query('SELECT * FROM PAYMENT WHERE Appointment_ID = ? ORDER BY Payment_Date', [params.id]);
  const audit = await query('SELECT * FROM APPOINTMENT_AUDIT WHERE Appointment_ID = ? ORDER BY Audit_ID', [params.id]);
  return { appointment, record: record || null, parts, invoice: invoice ? { ...invoice, ...inv2 } : null, payments, audit };
});
export const PATCH = route([], async (req, { params }, s) => {
  await loadAppointment(params.id, s);
  const b = await body(req);
  if (b.action === 'cancel') {
    await query('CALL sp_cancel_appointment(?)', [params.id]);
    logActivity(s, 'cancel_appointment', { appointmentId: +params.id });
  } else if (b.action === 'assign') {
    if (s.role === 'Customer') throw new HttpError(403, 'Not allowed');
    await query('UPDATE APPOINTMENT SET Staff_ID = ? WHERE Appointment_ID = ?', [b.staffId ? int(b.staffId, 'staffId') : null, params.id]);
  } else throw new HttpError(400, 'Unknown action');
  return { ok: true };
});
