import Link from 'next/link';
import { guard } from '@/lib/guard';
import { dashboard } from '@/lib/queries';
import Badge, { inr, dt } from '@/components/Badge';

export default async function Dashboard() {
  const s = await guard();
  const d = await dashboard(s);
  const max = Math.max(1, ...(d.monthly || []).map((m) => Number(m.Revenue)));
  return (
    <>
      <h1>Welcome, {s.name}</h1>
      <div className="grid g4">
        <div className="card kpi"><div className="v">{d.appt.open_jobs ?? 0}</div><div className="l">Open appointments</div></div>
        <div className="card kpi"><div className="v">{d.appt.upcoming ?? 0}</div><div className="l">Upcoming scheduled</div></div>
        <div className="card kpi"><div className="v">{d.appt.completed ?? 0}</div><div className="l">Completed services</div></div>
        {s.role === 'Admin' && <>
          <div className="card kpi"><div className="v">{inr(d.revenue.v)}</div><div className="l">Revenue collected</div></div>
          <div className="card kpi"><div className="v">{inr(d.outstanding.v)}</div><div className="l">Outstanding invoices</div></div>
          <div className="card kpi"><div className="v">{d.customers.v}</div><div className="l">Customers</div></div></>}
        {s.role === 'Customer' && <>
          <div className="card kpi"><div className="v">{d.vehicles.v}</div><div className="l">My vehicles</div></div>
          <div className="card kpi"><div className="v">{inr(d.due.v)}</div><div className="l">Balance due</div></div></>}
      </div>
      <div className="grid g2">
        <div className="card"><h2>Recent appointments</h2><div className="table-wrap"><table>
          <thead><tr><th>#</th><th>When</th><th>Vehicle</th><th>Service</th><th>Status</th></tr></thead>
          <tbody>{d.recent.map((a) => <tr key={a.Appointment_ID}><td><Link href={'/appointments/' + a.Appointment_ID}>{a.Appointment_ID}</Link></td>
            <td>{dt(a.Appointment_DateTime)}</td><td>{a.Registration_No}</td><td>{a.Service_Name}</td><td><Badge v={a.Status} /></td></tr>)}</tbody></table></div></div>
        {s.role === 'Admin' && <div className="card"><h2>Monthly revenue (view: v_monthly_revenue)</h2>
          {d.monthly.map((m) => <div key={m.Month} className="mt"><div>{m.Month} <b>{inr(m.Revenue)}</b> <span className="muted">({m.Payments} payments)</span></div>
            <div className="bar"><i style={{ width: (Number(m.Revenue) / max) * 100 + '%' }} /></div></div>)}</div>}
        {s.role !== 'Customer' && <div className="card"><h2>Low stock alerts (view: v_low_stock_parts)</h2>
          {d.lowStock.length === 0 ? <p className="muted">All parts above reorder level.</p> :
            <table><thead><tr><th>Part</th><th>Stock</th><th>Reorder at</th></tr></thead>
              <tbody>{d.lowStock.map((p) => <tr key={p.Part_ID}><td>{p.Part_Name}</td><td><Badge v="Failed" />{' '}{p.Stock_Qty}</td><td>{p.Reorder_Level}</td></tr>)}</tbody></table>}</div>}
      </div>
    </>
  );
}
