import { notFound } from 'next/navigation';
import { guard } from '@/lib/guard';
import { appointmentDetail, listParts, listMechanics } from '@/lib/queries';
import ApiForm from '@/components/ApiForm';
import ActionButton from '@/components/ActionButton';
import CompleteForm from '@/components/CompleteForm';
import Badge, { inr, dt } from '@/components/Badge';

export default async function Detail({ params }) {
  const s = await guard();
  const id = Number.parseInt(params.id, 10);
  const d = Number.isInteger(id) ? await appointmentDetail(s, id) : null;
  if (!d) notFound();
  const { a, record, parts, invoice, payments, checklist, feedback } = d;
  const open = ['Scheduled', 'In Progress'].includes(a.Status);
  const staffCan = s.role === 'Admin' || (s.role === 'Staff' && a.Staff_ID === s.staffId);
  const stock = staffCan && open ? await listParts() : [];
  const mechanics = s.role === 'Admin' && open ? await listMechanics() : [];
  const url = `/api/appointments/${id}`;
  return (
    <>
      <h1>Appointment #{id} <Badge v={a.Status} /></h1>
      <div className="grid g2">
        <div className="card"><h2>Booking</h2><table><tbody>
          <tr><th>When</th><td>{dt(a.Appointment_DateTime)}</td></tr><tr><th>Customer</th><td>{a.Customer_Name} {a.Customer_Phone && `(${a.Customer_Phone})`}</td></tr>
          <tr><th>Vehicle</th><td>{a.Registration_No} - {a.Vehicle}</td></tr><tr><th>Service</th><td>{a.Service_Name} ({inr(a.Base_Price)})</td></tr>
          <tr><th>Mechanic</th><td>{a.Staff_Name || 'Unassigned'}</td></tr><tr><th>Problem</th><td>{a.Problem_Description}</td></tr></tbody></table>
          <div className="mt">
            {s.role === 'Customer' && a.Status === 'Scheduled' && <ActionButton url={url} payload={{ status: 'Cancelled' }} label="Cancel appointment" confirm="Cancel this appointment?" className="danger" />}
            {staffCan && a.Status === 'Scheduled' && <ActionButton url={url} payload={{ status: 'In Progress' }} label="Start work" className="" />}
            {s.role === 'Admin' && open && <>{' '}<ActionButton url={url} payload={{ status: 'Cancelled' }} label="Cancel" confirm="Cancel this appointment?" className="danger" /></>}
          </div>
          {s.role === 'Admin' && open && <div className="mt"><ApiForm action={url} method="PATCH" submit="Assign" compact onDoneText="Mechanic assigned"
            fields={[{ name: 'staff_id', label: 'Assign mechanic', type: 'select', options: mechanics.map((m) => ({ value: m.Staff_ID, label: m.Name })) }]} /></div>}
        </div>
        {record && <div className="card"><h2>Service record</h2><table><tbody>
          <tr><th>Completed</th><td>{record.Completed_Date}</td></tr><tr><th>Inspection</th><td>{record.Inspection_Summary}</td></tr><tr><th>Diagnosis</th><td>{record.Diagnosis}</td></tr>
          <tr><th>Labour</th><td>{inr(record.Labor_Cost)}</td></tr><tr><th>Total</th><td><b>{inr(record.Total_Cost)}</b></td></tr>
          <tr><th>Warranty</th><td>{record.Under_Warranty ? <Badge v="Paid" /> : <span className="muted">Not active</span>} {record.Under_Warranty ? 'Under warranty' : ''}</td></tr></tbody></table>
          {parts.length > 0 && <table className="mt"><thead><tr><th>Part</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
            <tbody>{parts.map((p) => <tr key={p.Part_Name}><td>{p.Part_Name}</td><td>{p.Quantity}</td><td>{inr(p.Unit_Cost)}</td><td>{inr(p.Line_Total)}</td></tr>)}</tbody></table>}</div>}
      </div>

      {checklist && <div className="card"><h2>Inspection checklist <span className="muted" style={{ fontWeight: 400 }}>(MongoDB document)</span></h2>
        <table><thead><tr><th>Item</th><th>Status</th><th>Notes</th></tr></thead><tbody>{checklist.items.map((i) => <tr key={i.name}><td>{i.name}</td><td><Badge v={i.status === 'OK' ? 'Paid' : i.status === 'Replaced' ? 'Scheduled' : 'Failed'} />{' '}{i.status}</td><td>{i.notes}</td></tr>)}</tbody></table>
        <p className="muted">Odometer: {checklist.readings?.odometer_km ?? '-'} km · Battery: {checklist.readings?.battery_voltage ?? '-'} V</p></div>}

      {invoice && <div className="card"><h2>Invoice #{invoice.Invoice_ID} <Badge v={invoice.Status} /></h2>
        <p>Total <b>{inr(invoice.Total_Amount)}</b> · Paid {inr(invoice.Paid_Amount)} · Balance <b>{inr(invoice.Balance_Due)}</b></p>
        {payments.length > 0 && <table><thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th><th>Reference</th></tr></thead>
          <tbody>{payments.map((p) => <tr key={p.Payment_ID}><td>{dt(p.Payment_Date)}</td><td>{inr(p.Amount)}</td><td>{p.Payment_Method}</td><td><Badge v={p.Payment_Status} /></td><td>{p.Transaction_Ref}</td></tr>)}</tbody></table>}
        {invoice.Balance_Due > 0 && <div className="mt"><ApiForm action="/api/payments" submit="Pay now" compact onDoneText="Payment recorded" fields={[
          { name: 'appointment_id', label: 'Appointment', default: id, type: 'number', required: true },
          { name: 'amount', label: 'Amount (₹)', type: 'number', step: '0.01', min: '0.01', max: invoice.Balance_Due, default: invoice.Balance_Due, required: true },
          { name: 'method', label: 'Method', type: 'select', required: true, options: ['UPI', 'Card', 'NetBanking', 'Cash'].map((m) => ({ value: m, label: m })) }]} /></div>}</div>}

      {staffCan && open && <div className="card"><h2>Complete service</h2><CompleteForm appointmentId={id} parts={stock} /></div>}

      {s.role === 'Customer' && a.Status === 'Completed' && !feedback && <div className="card"><h2>Rate this service <span className="muted" style={{ fontWeight: 400 }}>(stored in MongoDB)</span></h2>
        <ApiForm action="/api/feedback" submit="Submit review" onDoneText="Thanks for your feedback" fields={[
          { name: 'appointment_id', label: 'Appointment', type: 'number', default: id, required: true },
          { name: 'rating', label: 'Rating (1-5)', type: 'number', min: 1, max: 5, required: true },
          { name: 'comment', label: 'Comment', type: 'textarea' }]} /></div>}
      {feedback && <div className="card"><h2>Customer review</h2><p>{'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}</p><p>{feedback.comment}</p></div>}
    </>
  );
}
