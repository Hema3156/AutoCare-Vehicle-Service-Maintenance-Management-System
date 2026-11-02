import { redirect } from 'next/navigation';
import { getSession } from './auth';
export async function guard(roles) {
  const s = await getSession();
  if (!s) redirect('/login');
  if (roles && !roles.includes(s.role)) redirect('/dashboard');
  return s;
}
