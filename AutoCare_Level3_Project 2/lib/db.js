import mysql from 'mysql2/promise';

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name} (see .env.example)`);
  return v;
}

const g = globalThis;
export function pool() {
  if (!g.__mysqlPool) {
    g.__mysqlPool = mysql.createPool({
      host: required('MYSQL_HOST'),
      port: Number(process.env.MYSQL_PORT || 3306),
      user: required('MYSQL_USER'),
      password: process.env.MYSQL_PASSWORD ?? '',
      database: required('MYSQL_DATABASE'),
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
      decimalNumbers: true,
    });
  }
  return g.__mysqlPool;
}

// Parameterised query helper (all user input goes through placeholders -> no SQL injection)
export async function query(sql, params = []) {
  const [rows] = await pool().execute(sql, params);
  return rows;
}

// Run several statements on one connection, e.g. CALL proc(..., @out); SELECT @out
export async function withConnection(fn) {
  const conn = await pool().getConnection();
  try { return await fn(conn); } finally { conn.release(); }
}

// Run a set of statements as one ACID transaction
export async function transaction(fn) {
  return withConnection(async (conn) => {
    await conn.beginTransaction();
    try { const r = await fn(conn); await conn.commit(); return r; }
    catch (e) { await conn.rollback(); throw e; }
  });
}
