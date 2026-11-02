import { transaction } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import { ok, fail, dbError, body, str } from '@/lib/api';
import { audit } from '@/lib/mongo';

export async function POST(req) {
  try {
    const b = await body(req);
    const name = str(b.name, 100), email = str(b.email, 150).toLowerCase(), phone = str(b.phone, 15), address = str(b.address, 255);
    const password = typeof b.password === 'string' ? b.password : '';
    if (name.length < 2) return fail('Name is required');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Enter a valid email address');
    if (phone && !/^[0-9+]{10,15}$/.test(phone)) return fail('Phone must be 10-15 digits');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return fail('Password needs 8+ characters with letters and numbers');
    const hash = await hashPassword(password);
    const ids = await transaction(async (c) => {
      const [u] = await c.execute('INSERT INTO USER_ACCOUNT (Name,Email,Phone,Password_Hash,Role) VALUES (?,?,?,?,?)', [name, email, phone || null, hash, 'Customer']);
      const [cu] = await c.execute('INSERT INTO CUSTOMER (User_ID,Address) VALUES (?,?)', [u.insertId, address || null]);
      return { uid: u.insertId, customerId: cu.insertId };
    });
    await createSession({ uid: ids.uid, role: 'Customer', name, customerId: ids.customerId, staffId: null });
    audit(email, 'register', 'USER_ACCOUNT', { uid: ids.uid });
    return ok({ ok: true }, 201);
  } catch (e) { return dbError(e); }
}
