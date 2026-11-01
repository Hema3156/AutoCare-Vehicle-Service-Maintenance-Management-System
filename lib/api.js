import { NextResponse } from 'next/server';
import { getSession } from './auth';

export const json = (data, status = 200) => NextResponse.json(data, { status });
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

// Wraps a route handler: authentication, role-based authorisation, and DB error mapping.
export function route(roles, fn) {
  return async (req, ctx) => {
    try {
      const session = await getSession();
      if (roles && !session) throw new HttpError(401, 'Please log in');
      if (roles && roles.length && !roles.includes(session.role)) throw new HttpError(403, 'Not allowed for your role');
      const res = await fn(req, ctx, session);
      return res instanceof NextResponse ? res : json(res);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      // MySQL errors: 1644 = SIGNAL from trigger/procedure, 3819 = CHECK violated, 1062 = duplicate, 1451/1452 = FK
      if (e.errno === 1644) return json({ error: e.sqlMessage }, 400);
      if (e.errno === 3819) return json({ error: 'Validation failed: ' + (e.sqlMessage.match(/'(.+?)'/)?.[1] || 'constraint violated') }, 400);
      if (e.errno === 1062) return json({ error: 'Duplicate value: that record already exists' }, 409);
      if (e.errno === 1451) return json({ error: 'Cannot delete: record is referenced by other data' }, 409);
      if (e.errno === 1452) return json({ error: 'Invalid reference: related record does not exist' }, 400);
      console.error(e);
      return json({ error: 'Server error' }, 500);
    }
  };
}

export const body = async (req) => { try { return await req.json(); } catch { throw new HttpError(400, 'Invalid JSON body'); } };
export function need(obj, fields) {
  for (const f of fields) if (obj[f] === undefined || obj[f] === null || obj[f] === '') throw new HttpError(400, `${f} is required`);
}
export const int = (v, name) => { const n = Number(v); if (!Number.isInteger(n)) throw new HttpError(400, `${name} must be an integer`); return n; };
export const num = (v, name) => { const n = Number(v); if (!Number.isFinite(n)) throw new HttpError(400, `${name} must be a number`); return n; };
