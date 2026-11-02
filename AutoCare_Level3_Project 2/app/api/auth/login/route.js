import { query } from '@/lib/db';
import { checkPassword, createSession } from '@/lib/auth';
import { ok, fail, dbError, body, str } from '@/lib/api';
import { audit } from '@/lib/mongo';

export async function POST(req) {
  try {
    const b = await body(req);
    const email = str(b.email, 150).toLowerCase();
    const password = typeof b.password === 'string' ? b.password : '';
    const [u] = await query(
      `SELECT u.User_ID, u.Name, u.Role, u.Password_Hash, c.Customer_ID, s.Staff_ID
       FROM USER_ACCOUNT u LEFT JOIN CUSTOMER c ON c.User_ID=u.User_ID LEFT JOIN STAFF s ON s.User_ID=u.User_ID
       WHERE u.Email = ?`, [email]);
    // same message for unknown email and wrong password (no user enumeration)
    if (!u || !(await checkPassword(password, u.Password_Hash))) { audit(email, 'login_failed', 'USER_ACCOUNT'); return fail('Invalid email or password', 401); }
    await createSession({ uid: u.User_ID, role: u.Role, name: u.Name, customerId: u.Customer_ID, staffId: u.Staff_ID });
    audit(email, 'login', 'USER_ACCOUNT', { role: u.Role });
    return ok({ ok: true });
  } catch (e) { return dbError(e); }
}
