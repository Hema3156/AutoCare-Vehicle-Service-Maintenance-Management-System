import Link from 'next/link';
import { guard } from '@/lib/guard';
import { query } from '@/lib/db';
import { mongoDb } from '@/lib/mongo';

export default async function Search({ searchParams }) {
  const s = await guard();
  const q = (searchParams.q || '').trim().slice(0, 100);
  let appts = [], services = [], fb = [];
  if (q.length >= 2) {
    const scope = s.role === 'Customer' ? ' AND d.Customer_ID = ?' : s.role === 'Staff' ? ' AND d.Staff_ID = ?' : '';
    const sp = s.role === 'Customer' ? [s.customerId] : s.role === 'Staff' ? [s.staffId] : [];
    appts = await query(`SELECT d.Appointment_ID, d.Problem_Description, d.Service_Name, d.Registration_No,
        MATCH(a.Problem_Description) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
      FROM APPOINTMENT a JOIN v_appointment_details d ON d.Appointment_ID=a.Appointment_ID
      WHERE MATCH(a.Problem_Description) AGAINST (? IN NATURAL LANGUAGE MODE)${scope} ORDER BY score DESC LIMIT 20`, [q, q, ...sp]);
    services = await query(`SELECT Service_ID, Service_Name, Description FROM SERVICE_TYPE
      WHERE MATCH(Service_Name, Description) AGAINST (? IN NATURAL LANGUAGE MODE) LIMIT 10`, [q]);
    if (s.role !== 'Customer') {
      try { const db = await mongoDb();
        fb = await db.collection('feedback').find({ $text: { $search: q } }, { projection: { score: { $meta: 'textScore' } } }).sort({ score: { $meta: 'textScore' } }).limit(10).toArray(); } catch {}
    }
  }
  return (
    <>
      <h1>Full-text search</h1>
      <form className="row card" method="GET"><div><label>Search problems, services and reviews</label><input name="q" defaultValue={q} placeholder="e.g. brake noise, battery, AC cooling" /></div><button>Search</button></form>
      {q && <>
        <div className="card"><h2>Appointments (MySQL FULLTEXT)</h2>{appts.length ? <table><tbody>{appts.map((a) => <tr key={a.Appointment_ID}>
          <td><Link href={'/appointments/' + a.Appointment_ID}>#{a.Appointment_ID}</Link></td><td>{a.Problem_Description}</td><td>{a.Service_Name}</td><td>{a.Registration_No}</td></tr>)}</tbody></table> : <p className="muted">No matches.</p>}</div>
        <div className="card"><h2>Services (MySQL FULLTEXT)</h2>{services.length ? <table><tbody>{services.map((x) => <tr key={x.Service_ID}><td>{x.Service_Name}</td><td className="muted">{x.Description}</td></tr>)}</tbody></table> : <p className="muted">No matches.</p>}</div>
        {s.role !== 'Customer' && <div className="card"><h2>Customer reviews (MongoDB text index)</h2>{fb.length ? <table><tbody>{fb.map((f) => <tr key={String(f._id)}><td>{'★'.repeat(f.rating)}</td><td>{f.service_name}</td><td>{f.comment}</td></tr>)}</tbody></table> : <p className="muted">No matches.</p>}</div>}</>}
    </>
  );
}
