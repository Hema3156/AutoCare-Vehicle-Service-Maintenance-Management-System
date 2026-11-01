import { guard } from '@/lib/guard';
import { sqlReports, mongoReports } from '@/lib/queries';
import { inr } from '@/components/Badge';

const T = ({ head, rows }) => <div className="table-wrap"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>
  {rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>) : <tr><td colSpan={head.length} className="muted">No data</td></tr>}</tbody></table></div>;

export default async function Reports() {
  await guard(['Admin']);
  const [q, m] = await Promise.all([sqlReports(), mongoReports()]);
  return (
    <>
      <h1>Reports</h1>
      <h2>SQL analytics (MySQL)</h2>
      <div className="grid g2">
        <div className="card"><h2>Revenue by service (JOIN + GROUP BY)</h2><T head={['Service', 'Jobs', 'Billed', 'Avg job']} rows={q.byService.map((r) => [r.Service_Name, r.Jobs, inr(r.Billed), inr(r.Avg_Value)])} /></div>
        <div className="card"><h2>Customers billed over ₹5,000 (HAVING)</h2><T head={['Customer', 'Jobs', 'Total billed']} rows={q.topCustomers.map((r) => [r.Name, r.Jobs, inr(r.Total_Billed)])} /></div>
        <div className="card"><h2>Collections by payment method</h2><T head={['Method', 'Payments', 'Total']} rows={q.byMethod.map((r) => [r.Payment_Method, r.Payments, inr(r.Total)])} /></div>
        <div className="card"><h2>Monthly revenue (view)</h2><T head={['Month', 'Payments', 'Revenue']} rows={q.monthly.map((r) => [r.Month, r.Payments, inr(r.Revenue)])} /></div>
        <div className="card"><h2>Vehicles never serviced (subquery)</h2><T head={['Reg. no.', 'Make', 'Model']} rows={q.idle.map((r) => [r.Registration_No, r.Make, r.Model])} /></div>
        <div className="card"><h2>Mechanic workload (view)</h2><T head={['Mechanic', 'Total', 'Completed', 'Open']} rows={q.workload.map((r) => [r.Name, r.Total_Appointments, r.Completed, r.Open_Jobs])} /></div>
      </div>
      <h2>Document analytics (MongoDB aggregation)</h2>
      {m.error ? <div className="msg err">{m.error}</div> :
        <div className="grid g2">
          <div className="card"><h2>Average rating by service ($group)</h2><T head={['Service', 'Avg rating', 'Reviews']} rows={m.ratingByService.map((r) => [r.service, r.avg, r.reviews])} /></div>
          <div className="card"><h2>Top feedback tags ($unwind)</h2><T head={['Tag', 'Count']} rows={m.topTags.map((r) => [r._id, r.count])} /></div>
          <div className="card"><h2>Items most often flagged "Needs Attention"</h2><T head={['Checklist item', 'Count']} rows={m.attention.map((r) => [r._id, r.count])} /></div>
        </div>}
    </>
  );
}
