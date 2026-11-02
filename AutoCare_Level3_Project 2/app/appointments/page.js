import Link from 'next/link';
import { guard } from '@/lib/guard';
import { listAppointments, listVehicles, listServices, listMechanics } from '@/lib/queries';
import ApiForm from '@/components/ApiForm';
import Badge, { dt } from '@/components/Badge';

export default async function Appointments({ searchParams }) {
  const s = await guard();
  const status = searchParams.status || '', q = (searchParams.q || '').slice(0, 80);
  const [rows, services] = await Promise.all([listAppointments(s, { status, q }), listServices()]);
  const canBook = s.role !== 'Staff';
  const vehicles = canBook ? await listVehicles(s) : [];
  const mechanics = s.role === 'Admin' ? await listMechanics() : [];
  const fields = [
    { name: 'vehicle_id', label: 'Vehicle', type: 'select', required: true, options: vehicles.map((v) => ({ value: v.Vehicle_ID, label: `${v.Registration_No} - ${v.Make} ${v.Model}` })) },
    { name: 'service_id', label: 'Service', type: 'select', required: true, options: services.map((v) => ({ value: v.Service_ID, label: `${v.Service_Name} (₹${v.Base_Price})` })) },
    ...(s.role === 'Admin' ? [{ name: 'staff_id', label: 'Mechanic (optional)', type: 'select', options: mechanics.map((m) => ({ value: m.Staff_ID, label: m.Name })) }] : []),
    { name: 'datetime', label: 'Date & time', type: 'datetime-local', required: true },
    { name: 'problem', label: 'Describe the problem', type: 'textarea' }];
  return (
    <>
      <h1>{s.role === 'Staff' ? 'My assigned jobs' : 'Appointments'}</h1>
      <div className="card">
        <form className="row" method="GET">
          <div><label>Search</label><input name="q" defaultValue={q} placeholder="customer, vehicle, service, problem" /></div>
          <div><label>Status</label><select name="status" defaultValue={status}><option value="">All</option>
            {['Scheduled', 'In Progress', 'Completed', 'Cancelled'].map((x) => <option key={x}>{x}</option>)}</select></div>
          <button>Filter</button>
        </form>
        <div className="table-wrap mt"><table>
          <thead><tr><th>#</th><th>When</th><th>Customer</th><th>Vehicle</th><th>Service</th><th>Mechanic</th><th>Status</th></tr></thead>
          <tbody>{rows.map((a) => <tr key={a.Appointment_ID}>
            <td><Link href={'/appointments/' + a.Appointment_ID}>{a.Appointment_ID}</Link></td><td>{dt(a.Appointment_DateTime)}</td>
            <td>{a.Customer_Name}</td><td>{a.Registration_No}<div className="muted">{a.Vehicle}</div></td><td>{a.Service_Name}</td>
            <td>{a.Staff_Name || <span className="muted">Unassigned</span>}</td><td><Badge v={a.Status} /></td></tr>)}
            {rows.length === 0 && <tr><td colSpan="7" className="muted">No appointments match.</td></tr>}</tbody></table></div>
      </div>
      {canBook && <div className="card"><h2>Book an appointment</h2><ApiForm action="/api/appointments" fields={fields} submit="Book appointment" onDoneText="Appointment booked" /></div>}
    </>
  );
}
