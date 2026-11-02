import { query } from '@/lib/db';
import { route, ok, fail, body, int } from '@/lib/api';
import { audit } from '@/lib/mongo';

export const PATCH = route(null, async (req, { params }, s) => {
  const id = int(params.id);
  const b = await body(req);
  const [a] = await query('SELECT * FROM v_appointment_details WHERE Appointment_ID=?', [id]);
  if (!a) return fail('Appointment not found', 404);

  if (s.role === 'Customer') {
    if (a.Customer_ID !== s.customerId) return fail('Forbidden', 403);
    if (b.status !== 'Cancelled' || a.Status !== 'Scheduled') return fail('Customers can only cancel scheduled appointments', 403);
  }
  if (s.role === 'Staff' && a.Staff_ID !== s.staffId) return fail('Forbidden', 403);

  if (b.staff_id !== undefined) {
    if (s.role !== 'Admin') return fail('Only admins can assign mechanics', 403);
    const staffId = int(b.staff_id);
    if (staffId) {
      const [{ free }] = await query(
        `SELECT fn_staff_is_free(?, ?, (SELECT COALESCE(Estimated_Duration,60) FROM SERVICE_TYPE WHERE Service_ID=?), ?) AS free`,
        [staffId, a.Appointment_DateTime, a.Service_ID, id]);
      if (!free) return fail('That mechanic is already booked for this slot');
    }
    await query('UPDATE APPOINTMENT SET Staff_ID=? WHERE Appointment_ID=?', [staffId, id]);
  }
  if (b.status) {
    if (!['In Progress', 'Cancelled'].includes(b.status)) return fail('Use the completion form to complete a job');
    await query('UPDATE APPOINTMENT SET Status=? WHERE Appointment_ID=?', [b.status, id]);   // trigger guards terminal states
  }
  audit(s.name, 'update_appointment', 'APPOINTMENT', { id, ...b });
  return ok({ ok: true });
});
