import { query } from '@/lib/db';
import { mongoDb } from '@/lib/mongo';
import { route, ok } from '@/lib/api';

// Full-text search: MySQL FULLTEXT (appointments, services) + MongoDB $text (feedback)
export const GET = route(null, async (req, ctx, s) => {
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 100);
  if (q.length < 2) return ok({ appointments: [], services: [], feedback: [] });
  const scope = s.role === 'Customer' ? ' AND Customer_ID = ' + Number(s.customerId) : s.role === 'Staff' ? ' AND Staff_ID = ' + Number(s.staffId) : '';
  const appointments = await query(
    `SELECT d.Appointment_ID, d.Problem_Description, d.Service_Name, d.Registration_No, d.Status,
            MATCH(a.Problem_Description) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
     FROM APPOINTMENT a JOIN v_appointment_details d ON d.Appointment_ID=a.Appointment_ID
     WHERE MATCH(a.Problem_Description) AGAINST (? IN NATURAL LANGUAGE MODE) ${scope} ORDER BY score DESC LIMIT 20`, [q, q]);
  const services = await query(
    `SELECT Service_ID, Service_Name, Description, Base_Price FROM SERVICE_TYPE
     WHERE MATCH(Service_Name, Description) AGAINST (? IN NATURAL LANGUAGE MODE) LIMIT 10`, [q]);
  let feedback = [];
  if (s.role !== 'Customer') {
    try {
      const db = await mongoDb();
      feedback = await db.collection('feedback').find({ $text: { $search: q } }, { projection: { score: { $meta: 'textScore' } } })
        .sort({ score: { $meta: 'textScore' } }).limit(10).toArray();
    } catch { /* mongo optional */ }
  }
  return ok({ appointments, services, feedback });
});
