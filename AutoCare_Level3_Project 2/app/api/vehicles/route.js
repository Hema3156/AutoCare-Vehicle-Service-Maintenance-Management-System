import { query } from '@/lib/db';
import { route, ok, fail, body, str, int } from '@/lib/api';

export const GET = route(null, async (req, ctx, s) => {
  const rows = s.role === 'Customer'
    ? await query('SELECT * FROM VEHICLE WHERE Customer_ID=? ORDER BY Vehicle_ID DESC', [s.customerId])
    : await query('SELECT v.*, u.Name AS Owner FROM VEHICLE v JOIN CUSTOMER c ON c.Customer_ID=v.Customer_ID JOIN USER_ACCOUNT u ON u.User_ID=c.User_ID ORDER BY v.Vehicle_ID DESC');
  return ok({ vehicles: rows });
});

export const POST = route(['Customer', 'Admin'], async (req, ctx, s) => {
  const b = await body(req);
  const customerId = s.role === 'Customer' ? s.customerId : int(b.customer_id);
  const reg = str(b.registration_no, 30).toUpperCase().replace(/\s+/g, '');
  const make = str(b.make, 60), model = str(b.model, 60);
  if (!customerId) return fail('Customer is required');
  if (!/^[A-Z0-9-]{4,20}$/.test(reg)) return fail('Registration number must be 4-20 letters/digits');
  if (!make || !model) return fail('Make and model are required');
  const year = int(b.year);
  const r = await query('INSERT INTO VEHICLE (Customer_ID,Registration_No,Make,Model,Year,Fuel_Type) VALUES (?,?,?,?,?,?)',
    [customerId, reg, make, model, year, str(b.fuel_type, 30) || null]);
  return ok({ id: r.insertId }, 201);
});
