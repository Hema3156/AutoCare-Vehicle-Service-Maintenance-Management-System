import mysql from 'mysql2/promise';

// Connection pool is cached on globalThis so Next.js hot-reload does not leak connections.
const g = globalThis;
export const pool =
  g.__mysqlPool ||
  (g.__mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
    decimalNumbers: true,
  }));

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params); // parameterised -> SQL-injection safe
  return rows;
}

// Calls a procedure that has one OUT parameter; returns that value.
export async function callWithOut(conn, call, params) {
  await conn.query('SET @out = 0');
  await conn.query(`CALL ${call}`, params);
  const [[r]] = await conn.query('SELECT @out AS id');
  return r.id;
}
