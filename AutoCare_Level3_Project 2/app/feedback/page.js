import Link from 'next/link';
import { guard } from '@/lib/guard';
import { query } from '@/lib/db';
import { mongoDb } from '@/lib/mongo';

export default async function Feedback() {
  const s = await guard(['Customer']);
  let mine = [], error = null;
  const pending = await query(`SELECT d.Appointment_ID, d.Service_Name, d.Registration_No FROM v_appointment_details d
    WHERE d.Customer_ID=? AND d.Status='Completed' ORDER BY d.Appointment_DateTime DESC`, [s.customerId]);
  try { const db = await mongoDb(); mine = await db.collection('feedback').find({ customer_id: s.customerId }).sort({ created_at: -1 }).toArray(); }
  catch (e) { error = 'Reviews are temporarily unavailable.'; }
  const done = new Set(mine.map((f) => f.appointment_id));
  return (
    <>
      <h1>My feedback</h1>
      {error && <div className="msg err">{error}</div>}
      <div className="card"><h2>Completed services</h2><table><tbody>{pending.map((p) => <tr key={p.Appointment_ID}>
        <td>#{p.Appointment_ID}</td><td>{p.Service_Name}</td><td>{p.Registration_No}</td>
        <td>{done.has(p.Appointment_ID) ? <span className="muted">Reviewed</span> : <Link href={'/appointments/' + p.Appointment_ID}>Write a review</Link>}</td></tr>)}</tbody></table></div>
      <div className="card"><h2>My reviews</h2>{mine.map((f) => <p key={String(f._id)}>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)} <b>{f.service_name}</b> — {f.comment}</p>)}</div>
    </>
  );
}
