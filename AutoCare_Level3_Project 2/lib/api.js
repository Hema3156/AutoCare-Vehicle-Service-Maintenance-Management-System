import { NextResponse } from 'next/server';
import { getSession } from './auth';

export const ok = (data = {}, status = 200) => NextResponse.json(data, { status });
export const fail = (message, status = 400) => NextResponse.json({ error: message }, { status });

// Translate MySQL errors (triggers, CHECKs, FKs, UNIQUEs) into friendly API errors
export function dbError(e) {
  if (e?.sqlState === '45000') return fail(e.sqlMessage, 400);               // SIGNAL from trigger/procedure
  if (e?.errno === 3819 || e?.errno === 4025) return fail('Validation failed: ' + (e.sqlMessage || 'constraint violated'), 400); // CHECK (MySQL 3819 / MariaDB 4025)
  switch (e?.code) {
    case 'ER_DUP_ENTRY': return fail('A record with the same unique value already exists', 409);
    case 'ER_CHECK_CONSTRAINT_VIOLATED': return fail('Validation failed: ' + (e.sqlMessage || 'constraint violated'), 400);
    case 'ER_ROW_IS_REFERENCED_2': return fail('Cannot delete: other records depend on this one', 409);
    case 'ER_NO_REFERENCED_ROW_2': return fail('Referenced record does not exist', 400);
    case 'ER_DATA_TOO_LONG': return fail('A value is too long', 400);
    case 'ER_TRUNCATED_WRONG_VALUE':
    case 'ER_WRONG_VALUE': return fail('A value has an invalid format', 400);
  }
  console.error(e);
  return fail('Internal server error', 500);
}

// Wrap a handler: enforces login + role, converts errors
export function route(roles, handler) {
  return async (req, ctx) => {
    try {
      const session = await getSession();
      if (!session) return fail('Not authenticated', 401);
      if (roles && !roles.includes(session.role)) return fail('Forbidden', 403);
      return await handler(req, ctx, session);
    } catch (e) { return dbError(e); }
  };
}

export async function body(req) { try { return await req.json(); } catch { return {}; } }
export const int = (v) => (v === '' || v == null ? null : Number.parseInt(v, 10));
export const str = (v, max = 255) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const num = (v) => (v === '' || v == null ? NaN : Number(v));
