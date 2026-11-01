import Link from 'next/link';
import { guard } from '@/lib/guard';
import { listInvoices } from '@/lib/queries';
import Badge, { inr, dt } from '@/components/Badge';

export default async function Billing() {
  const s = await guard();
  const rows = await listInvoices(s);
  return (
    <>
      <h1>{s.role === 'Customer' ? 'My invoices' : 'Billing'}</h1>
      <div className="card table-wrap"><table>
        <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Service</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.Invoice_ID}><td><Link href={'/appointments/' + r.Appointment_ID}>#{r.Invoice_ID}</Link></td><td>{dt(r.Invoice_Date)}</td>
          <td>{r.Customer_Name}<div className="muted">{r.Registration_No}</div></td><td>{r.Service_Name}</td><td>{inr(r.Total_Amount)}</td><td>{inr(r.Paid_Amount)}</td>
          <td><b>{inr(r.Balance_Due)}</b></td><td><Badge v={r.Status} /></td></tr>)}
          {rows.length === 0 && <tr><td colSpan="8" className="muted">No invoices yet.</td></tr>}</tbody></table></div>
    </>
  );
}
