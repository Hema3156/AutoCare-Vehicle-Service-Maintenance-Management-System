import { query, pool, callWithOut } from '@/lib/db';
import { body, need, route, HttpError, int, num } from '@/lib/api';
import { logActivity } from '@/lib/mongo';

export const dynamic = 'force-dynamic';
// Staff/Admin: start service record -> add parts -> finish. Each step is a transactional stored procedure.
export const POST = route(['Staff', 'Admin'], async (req, { params }, s) => {
  const b = await body(req);
  const appt = int(params.id, 'id');
  if (b.action === 'start') {
    need(b, ['labor']);
    const conn = await pool.getConnection();
    try {
      const id = await callWithOut(conn, 'sp_complete_service(?,?,?,?,@out)', [appt, b.inspection || null, b.diagnosis || null, num(b.labor, 'labor')]);
      logActivity(s, 'start_service', { appointmentId: appt, recordId: id });
      return { recordId: id };
    } finally { conn.release(); }
  }
  const [rec] = await query('SELECT Service_Record_ID FROM SERVICE_RECORD WHERE Appointment_ID = ?', [appt]);
  if (!rec) throw new HttpError(400, 'Start the service record first');
  if (b.action === 'addPart') {
    need(b, ['partId', 'qty']);
    await query('CALL sp_add_part_to_service(?,?,?)', [rec.Service_Record_ID, int(b.partId, 'partId'), int(b.qty, 'qty')]);
    logActivity(s, 'add_part', { appointmentId: appt, partId: +b.partId, qty: +b.qty });
    return { ok: true };
  }
  if (b.action === 'removePart') {
    await query('DELETE FROM SERVICE_PART WHERE Service_Record_ID = ? AND Part_ID = ?', [rec.Service_Record_ID, int(b.partId, 'partId')]);
    return { ok: true };
  }
  if (b.action === 'finish') {
    await query('CALL sp_finish_service(?)', [appt]);
    logActivity(s, 'finish_service', { appointmentId: appt });
    return { ok: true };
  }
  throw new HttpError(400, 'Unknown action');
});
