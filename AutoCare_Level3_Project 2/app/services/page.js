import { guard } from '@/lib/guard';
import { listServices } from '@/lib/queries';
import ApiForm from '@/components/ApiForm';
import ActionButton from '@/components/ActionButton';
import { inr } from '@/components/Badge';

export default async function Services() {
  await guard(['Admin']);
  const rows = await listServices();
  return (
    <>
      <h1>Service catalogue</h1>
      <div className="card table-wrap"><table>
        <thead><tr><th>Service</th><th>Description</th><th>Price</th><th>Duration</th><th>Warranty</th><th></th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.Service_ID}><td>{r.Service_Name}</td><td className="muted">{r.Description}</td><td>{inr(r.Base_Price)}</td>
          <td>{r.Estimated_Duration} min</td><td>{r.Warranty_Days} d</td>
          <td><ActionButton url={'/api/services/' + r.Service_ID} method="DELETE" label="Delete" confirm={`Delete ${r.Service_Name}?`} className="sec" /></td></tr>)}</tbody></table>
        <p className="muted">Deleting a service that already has appointments is blocked by the database (FK ON DELETE RESTRICT).</p></div>
      <div className="card"><h2>Add service</h2><ApiForm action="/api/services" submit="Add service" fields={[
        { name: 'service_name', label: 'Name', required: true }, { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'base_price', label: 'Base price (₹)', type: 'number', min: 0, step: '0.01', required: true },
        { name: 'estimated_duration', label: 'Duration (minutes)', type: 'number', min: 1 }, { name: 'warranty_days', label: 'Warranty (days)', type: 'number', min: 0 }]} /></div>
    </>
  );
}
