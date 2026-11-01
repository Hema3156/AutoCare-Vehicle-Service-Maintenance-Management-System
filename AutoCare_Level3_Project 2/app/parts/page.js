import { guard } from '@/lib/guard';
import { listParts } from '@/lib/queries';
import ApiForm from '@/components/ApiForm';
import Badge, { inr } from '@/components/Badge';

export default async function Parts() {
  const s = await guard(['Admin', 'Staff']);
  const parts = await listParts();
  return (
    <>
      <h1>Spare-part inventory</h1>
      <div className="card table-wrap"><table>
        <thead><tr><th>Part</th><th>Part no.</th><th>Stock</th><th>Reorder level</th><th>Unit price</th><th>Last restocked</th></tr></thead>
        <tbody>{parts.map((p) => <tr key={p.Part_ID}><td>{p.Part_Name}</td><td>{p.Part_Number}</td>
          <td>{p.Stock_Qty <= p.Reorder_Level ? <Badge v="Failed" /> : null} {p.Stock_Qty}</td><td>{p.Reorder_Level}</td><td>{inr(p.Unit_Price)}</td><td>{p.Last_Restocked ?? ''}</td></tr>)}</tbody></table></div>
      <div className="grid g2">
        <div className="card"><h2>Restock a part</h2><ApiForm action="/api/parts" submit="Restock" onDoneText="Stock updated" fields={[
          { name: 'action', label: 'Action', default: 'restock', type: 'select', required: true, options: [{ value: 'restock', label: 'Restock' }] },
          { name: 'part_id', label: 'Part', type: 'select', required: true, options: parts.map((p) => ({ value: p.Part_ID, label: p.Part_Name })) },
          { name: 'quantity', label: 'Quantity', type: 'number', min: 1, required: true }]} /></div>
        {s.role === 'Admin' && <div className="card"><h2>New part</h2><ApiForm action="/api/parts" submit="Add part" fields={[
          { name: 'part_name', label: 'Name', required: true }, { name: 'part_number', label: 'Part number' },
          { name: 'unit_price', label: 'Unit price (₹)', type: 'number', min: 0, step: '0.01', required: true },
          { name: 'stock_qty', label: 'Opening stock', type: 'number', min: 0 }, { name: 'reorder_level', label: 'Reorder level', type: 'number', min: 0 }]} /></div>}
      </div>
    </>
  );
}
