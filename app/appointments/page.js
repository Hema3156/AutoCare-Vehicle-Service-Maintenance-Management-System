'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, useApi, useMe, fmt } from '@/lib/client';
import { Err, Ok, Field, Badge } from '@/components/ui';

export default function Appointments() {
  const me = useMe();
  const [fl, setFl] = useState({ status: '', from: '', to: '', q: '', mine: '' });
  const qs = new URLSearchParams(Object.entries(fl).filter(([, v]) => v)).toString();
  const { data, error, reload } = useApi('/api/appointments' + (qs ? '?' + qs : ''));
  const vehicles = useApi('/api/vehicles').data, services = useApi('/api/services').data, staff = useApi('/api/staff').data;
  const [f, setF] = useState({ vehicleId: '', serviceId: '', staffId: '', dateTime: '', problem: '' }), [msg, setMsg] = useState(''), [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const book = async (e) => { e.preventDefault(); try { await api('/api/appointments', { method: 'POST', body: f }); setMsg('Appointment booked'); setErr(''); setF({ vehicleId: '', serviceId: '', staffId: '', dateTime: '', problem: '' }); reload(); } catch (x) { setErr(x.message); setMsg(''); } };
  const cancel = async (id) => { try { await api(`/api/appointments/${id}`, { method: 'PATCH', body: { action: 'cancel' } }); setMsg('Appointment cancelled'); reload(); } catch (x) { setErr(x.message); } };
  return (
    <>
      <h1>Appointments</h1><Err msg={error || err} /><Ok msg={msg} />
      <div className="card"><h2>Book a service</h2>
        <form className="row" onSubmit={book}>
          <Field label="Vehicle"><select required value={f.vehicleId} onChange={set('vehicleId')}><option value="">Select…</option>{vehicles?.map((v) => <option key={v.Vehicle_ID} value={v.Vehicle_ID}>{v.Registration_No} – {v.Make} {v.Model}</option>)}</select></Field>
          <Field label="Service"><select required value={f.serviceId} onChange={set('serviceId')}><option value="">Select…</option>{services?.map((s) => <option key={s.Service_ID} value={s.Service_ID}>{s.Service_Name} (₹{s.Base_Price})</option>)}</select></Field>
          <Field label="Staff (optional)"><select value={f.staffId} onChange={set('staffId')}><option value="">Auto / unassigned</option>{staff?.map((s) => <option key={s.Staff_ID} value={s.Staff_ID}>{s.Name}</option>)}</select></Field>
          <Field label="Date & time"><input type="datetime-local" required value={f.dateTime} onChange={set('dateTime')} /></Field>
          <Field label="Problem description"><textarea rows={2} value={f.problem} onChange={set('problem')} /></Field>
          <button>Book</button>
        </form></div>
      <div className="card">
        <div className="row">
          <Field label="Status"><select value={fl.status} onChange={(e) => setFl({ ...fl, status: e.target.value })}><option value="">All</option>{['Scheduled', 'In Progress', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="From"><input type="date" value={fl.from} onChange={(e) => setFl({ ...fl, from: e.target.value })} /></Field>
          <Field label="To"><input type="date" value={fl.to} onChange={(e) => setFl({ ...fl, to: e.target.value })} /></Field>
          <Field label="Search"><input placeholder="reg / customer / service" value={fl.q} onChange={(e) => setFl({ ...fl, q: e.target.value })} /></Field>
          {me?.staffId && <Field label="Assigned to"><select value={fl.mine} onChange={(e) => setFl({ ...fl, mine: e.target.value })}><option value="">Everyone</option><option value="1">Me</option></select></Field>}
        </div>
        <table><thead><tr><th>#</th><th>When</th><th>Customer</th><th>Vehicle</th><th>Service</th><th>Staff</th><th>Status</th><th>Invoice</th><th></th></tr></thead><tbody>
          {data?.map((a) => <tr key={a.Appointment_ID}><td>{a.Appointment_ID}</td><td>{fmt(a.Appointment_DateTime)}</td><td>{a.Customer_Name}</td><td>{a.Registration_No}<div className="muted">{a.Make} {a.Model}</div></td><td>{a.Service_Name}</td><td>{a.Staff_Name || '—'}</td>
            <td><Badge v={a.Status} /></td><td>{a.Invoice_Status ? <Badge v={a.Invoice_Status} /> : '—'}</td>
            <td><Link href={`/appointments/${a.Appointment_ID}`}>Open</Link>{a.Status === 'Scheduled' && <> · <a href="#" onClick={(e) => { e.preventDefault(); confirm('Cancel this appointment?') && cancel(a.Appointment_ID); }}>Cancel</a></>}</td></tr>)}
          {data && !data.length && <tr><td colSpan="9" className="muted">No appointments match.</td></tr>}
        </tbody></table></div>
    </>
  );
}
