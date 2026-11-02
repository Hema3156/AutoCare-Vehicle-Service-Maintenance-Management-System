import { query, withConnection } from '@/lib/db';
import { mongoDb, audit } from '@/lib/mongo';
import { route, ok, fail, body, str, int, num } from '@/lib/api';

export const POST = route(['Staff', 'Admin'], async (req, { params }, s) => {
  const id = int(params.id);
  const b = await body(req);
  const [a] = await query('SELECT Staff_ID, Vehicle_ID FROM APPOINTMENT WHERE Appointment_ID=?', [id]);
  if (!a) return fail('Appointment not found', 404);
  if (s.role === 'Staff' && a.Staff_ID !== s.staffId) return fail('Forbidden', 403);

  const labor = num(b.labor);
  if (!Number.isFinite(labor) || labor < 0) return fail('Labour cost must be 0 or more');
  const parts = (Array.isArray(b.parts) ? b.parts : [])
    .map((p) => ({ part_id: int(p.part_id), quantity: int(p.quantity) }))
    .filter((p) => p.part_id);
  if (parts.some((p) => !p.quantity || p.quantity < 1)) return fail('Part quantities must be at least 1');

  // One DB transaction (inside the stored procedure): record + parts + stock + invoice + status
  await withConnection((c) => c.query('CALL sp_complete_service(?,?,?,?,?)',
    [id, str(b.inspection, 2000) || null, str(b.diagnosis, 2000) || null, labor, JSON.stringify(parts)]));

  // Flexible inspection data -> MongoDB document
  let checklist = false;
  try {
    const cl = b.checklist || {};
    const items = (Array.isArray(cl.items) ? cl.items : []).slice(0, 30).map((i) => ({
      name: str(i.name, 60), status: ['OK', 'Needs Attention', 'Replaced'].includes(i.status) ? i.status : 'OK', notes: str(i.notes, 300),
    }));
    const [sr] = await query('SELECT Service_Record_ID FROM SERVICE_RECORD WHERE Appointment_ID=?', [id]);
    const db = await mongoDb();
    await db.collection('inspection_checklists').insertOne({
      appointment_id: id, service_record_id: sr?.Service_Record_ID, vehicle_id: a.Vehicle_ID,
      items, readings: { odometer_km: num(cl.odometer_km) || null, battery_voltage: num(cl.battery_voltage) || null },
      created_by: s.name, created_at: new Date(),
    });
    checklist = true;
  } catch { /* MongoDB optional: SQL data is already committed */ }
  audit(s.name, 'complete_service', 'APPOINTMENT', { id });
  return ok({ ok: true, checklist });
});
