import bcrypt from 'bcryptjs';
import { query, pool } from '@/lib/db';
import { body, need, route, HttpError, int } from '@/lib/api';
import { logActivity } from '@/lib/mongo';

export const dynamic = 'force-dynamic';
export const GET = route(['Admin'], async () =>
  query('SELECT User_ID, Name, Email, Phone, Role, Is_Active, Created_At FROM USER_ACCOUNT ORDER BY User_ID'));
// Admin creates Staff (or another Admin)
export const POST = route(['Admin'], async (req, ctx, s) => {
  const b = await body(req);
  need(b, ['name', 'email', 'password', 'role']);
  if (!['Staff', 'Admin'].includes(b.role)) throw new HttpError(400, 'Role must be Staff or Admin');
  if (String(b.password).length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query('INSERT INTO USER_ACCOUNT (Name, Email, Phone, Password_Hash, Role) VALUES (?,?,?,?,?)',
      [b.name, b.email.toLowerCase().trim(), b.phone || null, await bcrypt.hash(b.password, 10), b.role]);
    if (b.role === 'Staff') await conn.query('INSERT INTO STAFF (User_ID, Designation, Hire_Date) VALUES (?,?,CURDATE())', [r.insertId, b.designation || 'Mechanic']);
    await conn.commit();
    logActivity(s, 'create_user', { userId: r.insertId, role: b.role });
    return { id: r.insertId };
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
});
export const PATCH = route(['Admin'], async (req, ctx, s) => {
  const b = await body(req);
  const id = int(b.userId, 'userId');
  if (id === s.userId) throw new HttpError(400, 'You cannot deactivate your own account');
  await query('UPDATE USER_ACCOUNT SET Is_Active = ? WHERE User_ID = ?', [b.active ? 1 : 0, id]);
  logActivity(s, 'toggle_user', { userId: id, active: !!b.active });
  return { ok: true };
});
