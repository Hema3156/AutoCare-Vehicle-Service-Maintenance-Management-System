import { guard } from '@/lib/guard';
import { listStaffLoad } from '@/lib/queries';
import ApiForm from '@/components/ApiForm';

export default async function Staff() {
  await guard(['Admin']);
  const rows = await listStaffLoad();
  return (
    <>
      <h1>Staff & workload</h1>
      <div className="card table-wrap"><table>
        <thead><tr><th>Name</th><th>Designation</th><th>Total jobs</th><th>Completed</th><th>Open</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.Staff_ID}><td>{r.Name}</td><td>{r.Designation}</td><td>{r.Total_Appointments}</td><td>{r.Completed}</td><td>{r.Open_Jobs}</td></tr>)}</tbody></table></div>
      <div className="card"><h2>Add staff member</h2><ApiForm action="/api/staff" submit="Create staff account" fields={[
        { name: 'name', label: 'Full name', required: true }, { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone' }, { name: 'designation', label: 'Designation', required: true },
        { name: 'password', label: 'Temporary password', type: 'password', required: true, minLength: 8, auto: 'new-password' }]} /></div>
    </>
  );
}
