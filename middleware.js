import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC = ['/login', '/register'];
const ROLE_PAGES = { '/users': ['Admin'], '/parts': ['Admin', 'Staff'], '/reports': ['Admin', 'Staff'] };

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('autocare_token')?.value;
  let user = null;
  if (token) { try { user = (await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))).payload; } catch {} }
  if (PUBLIC.includes(pathname)) return user ? NextResponse.redirect(new URL('/dashboard', req.url)) : NextResponse.next();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));
  const allowed = ROLE_PAGES[pathname];
  if (allowed && !allowed.includes(user.role)) return NextResponse.redirect(new URL('/dashboard', req.url));
  return NextResponse.next();
}
// APIs enforce their own auth (401/403 JSON); pages are guarded here.
export const config = { matcher: ['/', '/login', '/register', '/dashboard', '/vehicles', '/appointments/:path*', '/appointments', '/services', '/parts', '/search', '/reports', '/users', '/invoices'] };
