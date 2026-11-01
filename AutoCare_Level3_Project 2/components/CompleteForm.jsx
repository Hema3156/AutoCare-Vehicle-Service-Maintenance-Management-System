'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CHECKS = ['Brakes', 'Tyres', 'Lights', 'Engine oil', 'Coolant', 'Battery', 'Suspension'];

export default function CompleteForm({ appointmentId, parts }) {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const f = new FormData(e.currentTarget);
    const items = CHECKS.map((n) => ({ name: n, status: f.get('st_' + n), notes: f.get('nt_' + n) })).filter((i) => i.status !== 'Skip');
    const payload = {
      inspection: f.get('inspection'), diagnosis: f.get('diagnosis'), labor: f.get('labor'),
      parts: rows.filter((r) => r.part_id).map((r) => ({ part_id: r.part_id, quantity: r.quantity })),
      checklist: { items, odometer_km: f.get('odometer'), battery_voltage: f.get('voltage') },
    };
    const res = await fetch(`/api/appointments/${appointmentId}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(json.error || 'Failed'); return; }
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="grid g2">
        <div><label>Inspection summary</label><textarea name="inspection" /></div>
        <div><label>Diagnosis</label><textarea name="diagnosis" /></div>
      </div>
      <div className="row"><div><label>Labour cost (₹)</label><input name="labor" type="number" min="0" step="0.01" required defaultValue="0" /></div></div>
      <h2 className="mt">Spare parts used</h2>
      {rows.map((r, i) => (
        <div className="row" key={i}>
          <div><select value={r.part_id} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, part_id: e.target.value } : x))}>
            <option value="">Select part</option>
            {parts.map((p) => <option key={p.Part_ID} value={p.Part_ID}>{p.Part_Name} (stock {p.Stock_Qty}, ₹{p.Unit_Price})</option>)}</select></div>
          <div><input type="number" min="1" value={r.quantity} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} /></div>
          <button type="button" className="sec" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
        </div>))}
      <button type="button" className="sec mt" onClick={() => setRows([...rows, { part_id: '', quantity: 1 }])}>+ Add part</button>
      <h2 className="mt">Inspection checklist <span className="muted" style={{ fontWeight: 400 }}>(stored in MongoDB)</span></h2>
      <table><tbody>{CHECKS.map((n) => <tr key={n}><td>{n}</td>
        <td><select name={'st_' + n} defaultValue="Skip">{['Skip', 'OK', 'Needs Attention', 'Replaced'].map((x) => <option key={x}>{x}</option>)}</select></td>
        <td><input name={'nt_' + n} placeholder="notes" maxLength={300} /></td></tr>)}</tbody></table>
      <div className="row"><div><label>Odometer (km)</label><input name="odometer" type="number" min="0" /></div>
        <div><label>Battery voltage</label><input name="voltage" type="number" step="0.1" min="0" /></div></div>
      <button disabled={busy} className="mt">{busy ? 'Saving...' : 'Complete service & generate invoice'}</button>
      {msg && <div className="msg err">{msg}</div>}
    </form>
  );
}
