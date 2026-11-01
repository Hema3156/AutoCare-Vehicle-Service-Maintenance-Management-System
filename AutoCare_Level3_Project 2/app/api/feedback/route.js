import { query } from '@/lib/db';
import { mongoDb } from '@/lib/mongo';
import { route, ok, fail, body, str, int } from '@/lib/api';

export const GET = route(null, async (req, ctx, s) => {
  const db = await mongoDb();
  const filter = s.role === 'Customer' ? { customer_id: s.customerId } : {};
  return ok({ feedback: await db.collection('feedback').find(filter).sort({ created_at: -1 }).limit(100).toArray() });
});

export const POST = route(['Customer'], async (req, ctx, s) => {
  const b = await body(req);
  const apptId = int(b.appointment_id), rating = int(b.rating);
  if (!apptId || !rating || rating < 1 || rating > 5) return fail('Rating must be 1 to 5');
  const [a] = await query('SELECT * FROM v_appointment_details WHERE Appointment_ID=? AND Customer_ID=?', [apptId, s.customerId]);
  if (!a) return fail('Forbidden', 403);
  if (a.Status !== 'Completed') return fail('You can review only completed services');
  const db = await mongoDb();
  try {
    await db.collection('feedback').insertOne({
      appointment_id: apptId, customer_id: s.customerId, service_id: a.Service_ID, service_name: a.Service_Name,
      staff_id: a.Staff_ID, rating, comment: str(b.comment, 1000),
      tags: (Array.isArray(b.tags) ? b.tags : []).map((t) => str(t, 30)).filter(Boolean).slice(0, 5), created_at: new Date(),
    });
  } catch (e) { if (e.code === 11000) return fail('You have already reviewed this service', 409); throw e; }
  return ok({ ok: true }, 201);
});
