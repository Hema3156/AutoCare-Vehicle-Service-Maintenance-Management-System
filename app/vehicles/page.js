'use client';
import { useState } from 'react';
import { api, useApi, useMe } from '@/lib/client';
import { Err, Ok, Field } from '@/components/ui';

const EMPTY = { registration: '', make: '', model: '', year: '', fuel: 'Petrol', odometer: 0, customerId: '' };
export default function Vehicles() {
  const me = useMe(), [q, setQ] = useState('');
  const { data, error, reload } = useApi('/api/vehicles' + (q ? `?q=${encodeURIComponent(q)}` : ''));
  const [f, setF] = useState(EMPTY), [edit, setEdit] = useState(null), [msg, setMsg] = useState(''), [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const run = async (fn, ok) => { try { await fn(); setMsg(ok); setErr(''); setF(EMPTY); setEdit(null); reload(); } catch (x) { setErr(x.message); setMsg(''); } };
  const save = (e) => { e.preventDefault(); run(() => edit ? api(`/api/vehicles/${edit}`, { method: 'PUT', body: f }) : api('/api/vehicles', { method: 'POST', body: f }), edit ? 'Vehicle updated' : 'Vehicle added'); };
  return (
    <>
      <h1>Vehicles</h1><Err msg={error || err} /><Ok msg={msg} />
      <div className="card"><h2>{edit ? 'Edit vehicle' : 'Add vehicle'}</h2>
        <form className="row" onSubmit={save}>
          <Field label="Registration No"><input required disabled={!!edit} value={f.registration} onChange={set('registration')} /></Field>
          <Field label="Make"><input required value={f.make} onChange={set('make')} /></Field>
          <Field label="Model"><input required value={f.model} onChange={set('model')} /></Field>
          <Field label="Year"><input type="number" min="1980" max="2100" value={f.year} onChange={set('year')} /></Field>
          <Field label="Fuel"><select value={f.fuel} onChange={set('fuel')}>{['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Odometer (km)"><input type="number" min="0" value={f.odometer} onChange={set('odometer')} /></Field>
          {me && me.role !== 'Customer' && !edit && <Field label="Customer ID"><input type="number" required value={f.customerId} onChange={set('customerId')} /></Field>}
          <button>{edit ? 'Update' : 'Add'}</button>{edit && <button type="button" className="alt" onClick={() => { setEdit(null); setF(EMPTY); }}>Cancel</button>}
        </form></div>
      <div className="card">
        <div className="row"><Field label="Search"><input placeholder="reg / make / model" value={q} onChange={(e) => setQ(e.target.value)} /></Field></div>
        <table><thead><tr><th>Reg No</th><th>Vehicle</th><th>Year</th><th>Fuel</th><th>Odometer</th><th>Owner</th><th>Services</th><th></th></tr></thead><tbody>
          {data?.map((v) => <tr key={v.Vehicle_ID}><td>{v.Registration_No}</td><td>{v.Make} {v.Model}</td><td>{v.Year}</td><td>{v.Fuel_Type}</td><td>{v.Odometer_KM} km</td><td>{v.Owner}</td><td>{v.Services}</td>
            <td><button className="sm alt" onClick={() => { setEdit(v.Vehicle_ID); setF({ registration: v.Registration_No, make: v.Make, model: v.Model, year: v.Year || '', fuel: v.Fuel_Type, odometer: v.Odometer_KM, customerId: '' }); window.scrollTo(0, 0); }}>Edit</button>{' '}
              <button className="sm danger" onClick={() => confirm('Delete this vehicle?') && run(() => api(`/api/vehicles/${v.Vehicle_ID}`, { method: 'DELETE' }), 'Vehicle deleted')}>Delete</button></td></tr>)}
        </tbody></table></div>
    </>
  );
}
