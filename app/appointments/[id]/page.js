'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi, useMe, money, fmt } from '@/lib/client';
import { Err, Ok, Field, Badge } from '@/components/ui';

export default function AppointmentDetail() {
  const { id } = useParams(), me = useMe();
  const { data: d, error, reload } = useApi(`/api/appointments/${id}`);
  const insp = useApi(`/api/inspections?appointmentId=${id}`), fb = useApi(`/api/feedback?appointmentId=${id}`);
  const parts = useApi(me && me.role !== 'Customer' ? '/api/parts' : '/api/auth/me').data;
  const [msg, setMsg] = useState(''), [err, setErr] = useState('');
  const [sv, setSv] = useState({ inspection: '', diagnosis: '', labor: 0 }), [pt, setPt] = useState({ partId: '', qty: 1 });
  const [pay, setPay] = useState({ amount: '', method: 'UPI' }), [rev, setRev] = useState({ rating: 5, comment: '' });
  const [chk, setChk] = useState([{ item: 'Engine oil', status: 'OK', note: '' }]);
  const act = async (fn, ok) => { try { await fn(); setMsg(ok); setErr(''); reload(); insp.reload(); fb.reload(); } catch (x) { setErr(x.message); setMsg(''); } };
  if (error) return <Err msg={error} />;
  if (!d) return <p>Loading…</p>;
  const a = d.appointment, staffSide = me && me.role !== 'Customer', r = d.record, inv = d.invoice;
  return (
    <>
      <h1>Appointment #{a.Appointment_ID} <Badge v={a.Status} /></h1><Err msg={err} /><Ok msg={msg} />
      <div className="two">
        <div className="card"><h2>Details</h2>
          <p><b>{a.Service_Name}</b> · base {money(a.Base_Price)}</p><p>{a.Make} {a.Model} ({a.Registration_No})</p>
          <p>Customer: {a.Customer_Name} · {a.Customer_Phone || '—'}</p><p>When: {fmt(a.Appointment_DateTime)} · Staff: {a.Staff_Name || 'unassigned'}</p>
          <p className="muted">Problem: {a.Problem_Description || '—'}</p>
          {d.audit.length > 0 && <><h2>Status history (trigger audit)</h2><table><tbody>{d.audit.map((x) => <tr key={x.Audit_ID}><td>{fmt(x.Changed_At)}</td><td>{x.Old_Status} → {x.New_Status}</td></tr>)}</tbody></table></>}
        </div>
        <div className="card"><h2>Service record</h2>
          {r ? <><p>Inspection: {r.Inspection_Summary || '—'}</p><p>Diagnosis: {r.Diagnosis || '—'}</p><p>Labor {money(r.Labor_Cost)} · <b>Total work cost {money(r.Total_Cost)}</b></p>
            {r.Completed_Date && <p className="muted">Completed {r.Completed_Date} · warranty until {r.Warranty_Until}</p>}
            <table><thead><tr><th>Part</th><th>Qty</th><th>Unit</th><th>Total</th><th></th></tr></thead><tbody>
              {d.parts.map((p) => <tr key={p.Part_ID}><td>{p.Part_Name}</td><td>{p.Quantity}</td><td>{money(p.Unit_Cost)}</td><td>{money(p.Line_Total)}</td>
                <td>{staffSide && a.Status === 'In Progress' && <button className="sm danger" onClick={() => act(() => api(`/api/appointments/${id}/service`, { method: 'POST', body: { action: 'removePart', partId: p.Part_ID } }), 'Part removed, stock restored')}>×</button>}</td></tr>)}
            </tbody></table></> : <p className="muted">No service record yet.</p>}
        </div>
      </div>

      {staffSide && ['Scheduled', 'In Progress'].includes(a.Status) && (
        <div className="card"><h2>Staff actions</h2>
          {!r && <form className="row" onSubmit={(e) => { e.preventDefault(); act(() => api(`/api/appointments/${id}/service`, { method: 'POST', body: { action: 'start', ...sv } }), 'Service started'); }}>
            <Field label="Inspection summary"><textarea rows={2} value={sv.inspection} onChange={(e) => setSv({ ...sv, inspection: e.target.value })} /></Field>
            <Field label="Diagnosis"><textarea rows={2} value={sv.diagnosis} onChange={(e) => setSv({ ...sv, diagnosis: e.target.value })} /></Field>
            <Field label="Labor cost"><input type="number" min="0" step="0.01" value={sv.labor} onChange={(e) => setSv({ ...sv, labor: e.target.value })} /></Field><button>Start service</button></form>}
          {r && a.Status === 'In Progress' && <>
            <form className="row" onSubmit={(e) => { e.preventDefault(); act(() => api(`/api/appointments/${id}/service`, { method: 'POST', body: { action: 'addPart', ...pt } }), 'Part added (stock deducted by trigger)'); }}>
              <Field label="Spare part"><select required value={pt.partId} onChange={(e) => setPt({ ...pt, partId: e.target.value })}><option value="">Select…</option>{Array.isArray(parts) && parts.map((p) => <option key={p.Part_ID} value={p.Part_ID}>{p.Part_Name} (stock {p.Stock_Qty}, {money(p.Unit_Price)})</option>)}</select></Field>
              <Field label="Qty"><input type="number" min="1" value={pt.qty} onChange={(e) => setPt({ ...pt, qty: e.target.value })} /></Field><button>Add part</button>
              <button type="button" className="alt" onClick={() => act(() => api(`/api/appointments/${id}/service`, { method: 'POST', body: { action: 'finish' } }), 'Service completed')}>Mark completed</button></form></>}
        </div>)}

      {staffSide && (
        <div className="card"><h2>Inspection checklist (MongoDB document)</h2>
          {insp.data ? <table><thead><tr><th>Item</th><th>Status</th><th>Note</th></tr></thead><tbody>{insp.data.checklist.map((c, i) => <tr key={i}><td>{c.item}</td><td>{c.status}</td><td>{c.note}</td></tr>)}</tbody></table> : <p className="muted">No checklist stored yet.</p>}
          {chk.map((c, i) => <div className="row" key={i}>
            <Field label="Item"><input value={c.item} onChange={(e) => setChk(chk.map((x, j) => (j === i ? { ...x, item: e.target.value } : x)))} /></Field>
            <Field label="Status"><select value={c.status} onChange={(e) => setChk(chk.map((x, j) => (j === i ? { ...x, status: e.target.value } : x)))}>{['OK', 'Needs Attention', 'Replace'].map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Note"><input value={c.note} onChange={(e) => setChk(chk.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} /></Field></div>)}
          <div className="row"><button className="alt" onClick={() => setChk([...chk, { item: '', status: 'OK', note: '' }])}>+ item</button>
            <button onClick={() => act(() => api('/api/inspections', { method: 'POST', body: { appointmentId: +id, checklist: chk.filter((c) => c.item) } }), 'Checklist saved')}>Save checklist</button></div>
        </div>)}

      <div className="card"><h2>Billing</h2>
        {inv ? <>
          <p>Invoice #{inv.Invoice_ID} <Badge v={inv.Status} /> · Subtotal {money(inv.Subtotal)} + GST {money(inv.Tax)} = <b>{money(inv.Total_Amount)}</b> · Paid {money(inv.Paid_Amount)} · <b>Due {money(inv.Balance_Due)}</b></p>
          {inv.Balance_Due > 0 && <form className="row" onSubmit={(e) => { e.preventDefault(); act(() => api('/api/payments', { method: 'POST', body: { appointmentId: +id, ...pay } }), 'Payment recorded'); }}>
            <Field label="Amount"><input type="number" step="0.01" min="1" max={inv.Balance_Due} required value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
            <Field label="Method"><select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}>{['UPI', 'Card', 'Cash', 'NetBanking'].map((m) => <option key={m}>{m}</option>)}</select></Field><button>Pay</button></form>}
          <table><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Ref</th></tr></thead><tbody>{d.payments.map((p) => <tr key={p.Payment_ID}><td>{fmt(p.Payment_Date)}</td><td>{money(p.Amount)}</td><td>{p.Payment_Method}</td><td>{p.Payment_Status}</td><td>{p.Transaction_Ref}</td></tr>)}</tbody></table></>
          : a.Status === 'Completed' && staffSide ? <button onClick={() => act(() => api('/api/invoices', { method: 'POST', body: { appointmentId: +id } }), 'Invoice generated')}>Generate invoice</button>
          : <p className="muted">No invoice yet.</p>}
      </div>

      {me?.role === 'Customer' && a.Status === 'Completed' && (
        <div className="card"><h2>Your feedback (MongoDB)</h2>
          {fb.data ? <p>You rated {fb.data.rating}/5 — “{fb.data.comment}”</p> :
            <form className="row" onSubmit={(e) => { e.preventDefault(); act(() => api('/api/feedback', { method: 'POST', body: { appointmentId: +id, ...rev } }), 'Thanks for your feedback'); }}>
              <Field label="Rating"><select value={rev.rating} onChange={(e) => setRev({ ...rev, rating: +e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select></Field>
              <Field label="Comment"><textarea rows={2} value={rev.comment} onChange={(e) => setRev({ ...rev, comment: e.target.value })} /></Field><button>Submit</button></form>}
        </div>)}
    </>
  );
}
