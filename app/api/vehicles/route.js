import { query } from '@/lib/db';
import { body, need, route, int } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const GET = route([], async (req, ctx, s) => {
  const q = new URL(req.url).searchParams.get('q');
  const where = [], p = [];
  if (s.role === 'Customer') { where.push('v.Customer_ID = ?'); p.push(s.customerId); }
  if (q) { where.push('(v.Registration_No LIKE ? OR v.Make LIKE ? OR v.Model LIKE ?)'); p.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  return query(
    `SELECT v.*, u.Name AS Owner,
            (SELECT COUNT(*) FROM APPOINTMENT a WHERE a.Vehicle_ID=v.Vehicle_ID) AS Services
       FROM VEHICLE v JOIN CUSTOMER c ON c.Customer_ID=v.Customer_ID JOIN USER_ACCOUNT u ON u.User_ID=c.User_ID
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY v.Vehicle_ID DESC`, p);
});
export const POST = route([], async (req, ctx, s) => {
  const b = await body(req);
  need(b, ['registration', 'make', 'model']);
  const customerId = s.role === 'Customer' ? s.customerId : int(b.customerId, 'customerId');
  const r = await query(
    'INSERT INTO VEHICLE (Customer_ID, Registration_No, Make, Model, Year, Fuel_Type, Odometer_KM) VALUES (?,?,?,?,?,?,?)',
    [customerId, b.registration.toUpperCase().trim(), b.make, b.model, b.year || null, b.fuel || 'Petrol', b.odometer || 0]);
  return { id: r.insertId };
});
