import { transaction } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { route, ok, fail, body, str } from '@/lib/api';

export const POST = route(['Admin'], async (req) => {
  const b = await body(req);
  const name = str(b.name, 100), email = str(b.email, 150).toLowerCase(), designation = str(b.designation, 100);
  const password = typeof b.password === 'string' ? b.password : '';
  if (name.length < 2 || !designation) return fail('Name and designation are required');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Enter a valid email address');
  if (password.length < 8) return fail('Password must be at least 8 characters');
  const hash = await hashPassword(password);
  const id = await transaction(async (c) => {
    const [u] = await c.execute('INSERT INTO USER_ACCOUNT (Name,Email,Phone,Password_Hash,Role) VALUES (?,?,?,?,?)', [name, email, str(b.phone, 15) || null, hash, 'Staff']);
    const [s] = await c.execute('INSERT INTO STAFF (User_ID,Designation,Hire_Date) VALUES (?,?,CURDATE())', [u.insertId, designation]);
    return s.insertId;
  });
  return ok({ id }, 201);
});
