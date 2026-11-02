import { guard } from '@/lib/guard';
import { listVehicles, listCustomers } from '@/lib/queries';
import ApiForm from '@/components/ApiForm';

export default async function Vehicles() {
  const s = await guard(['Customer', 'Admin', 'Staff']);
  const vehicles = await listVehicles(s);
  const customers = s.role === 'Admin' ? await listCustomers() : [];
  const fields = [
    ...(s.role === 'Admin' ? [{ name: 'customer_id', label: 'Owner', type: 'select', required: true, options: customers.map((c) => ({ value: c.Customer_ID, label: c.Name })) }] : []),
    { name: 'registration_no', label: 'Registration no.', required: true, maxLength: 30, placeholder: 'KA01AB1234' },
    { name: 'make', label: 'Make', required: true }, { name: 'model', label: 'Model', required: true },
    { name: 'year', label: 'Year', type: 'number', min: 1980, max: 2100 },
    { name: 'fuel_type', label: 'Fuel', type: 'select', options: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((v) => ({ value: v, label: v })) }];
  return (
    <>
      <h1>{s.role === 'Customer' ? 'My vehicles' : 'Vehicles'}</h1>
      <div className="card table-wrap"><table>
        <thead><tr><th>Reg. no.</th><th>Vehicle</th><th>Year</th><th>Fuel</th>{s.role !== 'Customer' && <th>Owner</th>}</tr></thead>
        <tbody>{vehicles.map((v) => <tr key={v.Vehicle_ID}><td>{v.Registration_No}</td><td>{v.Make} {v.Model}</td><td>{v.Year}</td><td>{v.Fuel_Type}</td>{s.role !== 'Customer' && <td>{v.Owner}</td>}</tr>)}</tbody></table></div>
      {s.role !== 'Staff' && <div className="card"><h2>Add a vehicle</h2><ApiForm action="/api/vehicles" fields={fields} submit="Add vehicle" compact /></div>}
    </>
  );
}
