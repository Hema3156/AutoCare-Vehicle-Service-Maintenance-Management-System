import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const COOKIE = 'autocare_token';
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function signToken(payload) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(secret());
}
export async function verifyToken(token) {
  try { return (await jwtVerify(token, secret())).payload; } catch { return null; }
}
export async function getSession() {
  const t = cookies().get(COOKIE)?.value;
  return t ? verifyToken(t) : null;
}
