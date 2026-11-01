import { query } from './db';
import { mongoDb } from './mongo';

const scopeSql = (s, alias = '') => {
  const a = alias ? alias + '.' : '';
  if (s.role === 'Customer') return { sql: ` AND ${a}Customer_ID = ?`, p: [s.customerId] };
  if (s.role === 'Staff') return { sql: ` AND ${a}Staff_ID = ?`, p: [s.staffId] };
  return { sql: '', p: [] };
};

export async function dashboard(s) {
  const sc = scopeSql(s);
  const [appt] = await query(
    `SELECT SUM(Status IN ('Scheduled','In Progress')) AS open_jobs, SUM(Status='Completed') AS completed,
            SUM(Status='Scheduled' AND Appointment_DateTime >= NOW()) AS upcoming
     FROM v_appointment_details WHERE 1=1${sc.sql}`, sc.p);
  const out = { appt };
  if (s.role === 'Admin') {
    [out.revenue] = await query(`SELECT COALESCE(SUM(Amount),0) AS v FROM PAYMENT WHERE Payment_Status='Completed'`);
    [out.outstanding] = await query(`SELECT COALESCE(SUM(Balance_Due),0) AS v FROM v_invoice_balance WHERE Status <> 'Cancelled'`);
    [out.customers] = await query('SELECT COUNT(*) AS v FROM CUSTOMER');
    out.monthly = await query('SELECT * FROM v_monthly_revenue ORDER BY Month DESC LIMIT 6');
  }
  if (s.role !== 'Customer') out.lowStock = await query('SELECT * FROM v_low_stock_parts ORDER BY Shortfall DESC');
  if (s.role === 'Customer') {
    [out.vehicles] = await query('SELECT COUNT(*) AS v FROM VEHICLE WHERE Customer_ID=?', [s.customerId]);
    [out.due] = await query(
      `SELECT COALESCE(SUM(b.Balance_Due),0) AS v FROM v_invoice_balance b JOIN v_appointment_details d ON d.Appointment_ID=b.Appointment_ID
       WHERE d.Customer_ID=? AND b.Status <> 'Cancelled'`, [s.customerId]);
  }
  out.recent = await query(`SELECT * FROM v_appointment_details WHERE 1=1${sc.sql} ORDER BY Appointment_DateTime DESC LIMIT 5`, sc.p);
  return out;
}

export async function listAppointments(s, { status, q }) {
  const sc = scopeSql(s);
  const where = [`1=1${sc.sql}`], p = [...sc.p];
  if (status) { where.push('Status = ?'); p.push(status); }
  if (q) {
    where.push(`(Customer_Name LIKE ? OR Registration_No LIKE ? OR Service_Name LIKE ? OR Problem_Description LIKE ?)`);
    const like = `%${q}%`; p.push(like, like, like, like);
  }
  return query(`SELECT * FROM v_appointment_details WHERE ${where.join(' AND ')} ORDER BY Appointment_DateTime DESC LIMIT 200`, p);
}

export async function appointmentDetail(s, id) {
  const sc = scopeSql(s);
  const [a] = await query(`SELECT * FROM v_appointment_details WHERE Appointment_ID=?${sc.sql}`, [id, ...sc.p]);
  if (!a) return null;
  const [record] = await query(
    `SELECT sr.*, fn_warranty_valid(sr.Service_Record_ID) AS Under_Warranty FROM SERVICE_RECORD sr WHERE Appointment_ID=?`, [id]);
  const parts = record ? await query(
    `SELECT p.Part_Name, sp.Quantity, sp.Unit_Cost, sp.Quantity*sp.Unit_Cost AS Line_Total
     FROM SERVICE_PART sp JOIN SPARE_PART p ON p.Part_ID=sp.Part_ID WHERE sp.Service_Record_ID=?`, [record.Service_Record_ID]) : [];
  const [invoice] = await query('SELECT * FROM v_invoice_balance WHERE Appointment_ID=?', [id]);
  const payments = await query('SELECT * FROM PAYMENT WHERE Appointment_ID=? ORDER BY Payment_Date', [id]);
  let checklist = null, feedback = null;
  try {
    const db = await mongoDb();
    checklist = await db.collection('inspection_checklists').findOne({ appointment_id: id });
    feedback = await db.collection('feedback').findOne({ appointment_id: id });
  } catch { /* Mongo optional */ }
  return { a, record, parts, invoice, payments, checklist, feedback };
}

export const listVehicles = (s) => s.role === 'Customer'
  ? query('SELECT * FROM VEHICLE WHERE Customer_ID=? ORDER BY Vehicle_ID DESC', [s.customerId])
  : query(`SELECT v.*, u.Name AS Owner FROM VEHICLE v JOIN CUSTOMER c ON c.Customer_ID=v.Customer_ID
           JOIN USER_ACCOUNT u ON u.User_ID=c.User_ID ORDER BY v.Vehicle_ID DESC`);

export const listServices = () => query('SELECT * FROM SERVICE_TYPE ORDER BY Service_Name');
export const listParts = () => query('SELECT * FROM SPARE_PART ORDER BY Part_Name');
export const listMechanics = () => query(
  `SELECT st.Staff_ID, u.Name, st.Designation FROM STAFF st JOIN USER_ACCOUNT u ON u.User_ID=st.User_ID ORDER BY u.Name`);
export const listStaffLoad = () => query('SELECT * FROM v_staff_workload ORDER BY Name');
export const listCustomers = () => query(
  `SELECT c.Customer_ID, u.Name FROM CUSTOMER c JOIN USER_ACCOUNT u ON u.User_ID=c.User_ID ORDER BY u.Name`);

export async function listInvoices(s) {
  const sc = scopeSql(s, 'd');
  return query(
    `SELECT b.*, d.Customer_Name, d.Registration_No, d.Service_Name FROM v_invoice_balance b
     JOIN v_appointment_details d ON d.Appointment_ID=b.Appointment_ID WHERE 1=1${sc.sql} ORDER BY b.Invoice_Date DESC`, sc.p);
}

export async function sqlReports() {
  const byService = await query(
    `SELECT s.Service_Name, COUNT(*) AS Jobs, SUM(sr.Total_Cost) AS Billed, ROUND(AVG(sr.Total_Cost),2) AS Avg_Value
     FROM SERVICE_RECORD sr JOIN APPOINTMENT a ON a.Appointment_ID=sr.Appointment_ID JOIN SERVICE_TYPE s ON s.Service_ID=a.Service_ID
     GROUP BY s.Service_ID, s.Service_Name ORDER BY Billed DESC`);
  const topCustomers = await query(
    `SELECT cu.Name, COUNT(DISTINCT a.Appointment_ID) AS Jobs, SUM(i.Total_Amount) AS Total_Billed
     FROM CUSTOMER c JOIN USER_ACCOUNT cu ON cu.User_ID=c.User_ID JOIN VEHICLE v ON v.Customer_ID=c.Customer_ID
     JOIN APPOINTMENT a ON a.Vehicle_ID=v.Vehicle_ID JOIN INVOICE i ON i.Appointment_ID=a.Appointment_ID
     GROUP BY c.Customer_ID, cu.Name HAVING SUM(i.Total_Amount) > 5000 ORDER BY Total_Billed DESC`);
  const byMethod = await query(
    `SELECT Payment_Method, COUNT(*) AS Payments, SUM(Amount) AS Total FROM PAYMENT WHERE Payment_Status='Completed'
     GROUP BY Payment_Method ORDER BY Total DESC`);
  const monthly = await query('SELECT * FROM v_monthly_revenue ORDER BY Month');
  const idle = await query(
    `SELECT Registration_No, Make, Model FROM VEHICLE
     WHERE Vehicle_ID NOT IN (SELECT Vehicle_ID FROM APPOINTMENT WHERE Status='Completed')`);
  const workload = await query('SELECT * FROM v_staff_workload ORDER BY Total_Appointments DESC');
  return { byService, topCustomers, byMethod, monthly, idle, workload };
}

// MongoDB aggregation pipelines
export async function mongoReports() {
  try {
    const db = await mongoDb();
    const ratingByService = await db.collection('feedback').aggregate([
      { $group: { _id: '$service_name', avg: { $avg: '$rating' }, reviews: { $sum: 1 } } },
      { $project: { _id: 0, service: '$_id', avg: { $round: ['$avg', 2] }, reviews: 1 } },
      { $sort: { avg: -1 } }]).toArray();
    const topTags = await db.collection('feedback').aggregate([
      { $unwind: '$tags' }, { $group: { _id: '$tags', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]).toArray();
    const attention = await db.collection('inspection_checklists').aggregate([
      { $unwind: '$items' }, { $match: { 'items.status': 'Needs Attention' } },
      { $group: { _id: '$items.name', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray();
    return { ratingByService, topTags, attention };
  } catch (e) { return { error: 'MongoDB not reachable: ' + e.message }; }
}
