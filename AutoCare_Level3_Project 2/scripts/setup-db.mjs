// Runs all SQL files in /sql against MySQL using the env vars in .env.local (npm run db:setup)
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { loadEnv } from './env.mjs';

loadEnv();
const dir = path.resolve('sql');
const files = fs.readdirSync(dir).filter((f) => /^0[1-5]_.*\.sql$/.test(f)).sort();
const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_ADMIN_USER || process.env.MYSQL_USER, password: process.env.MYSQL_ADMIN_PASSWORD ?? process.env.MYSQL_PASSWORD, multipleStatements: true });
if (process.argv.includes('--reset')) { await conn.query('DROP DATABASE IF EXISTS AutoCareDB'); console.log('Dropped AutoCareDB'); }

for (const f of files) {
  let sql = fs.readFileSync(path.join(dir, f), 'utf8');
  // the CLI-only DELIMITER directive is not valid over the protocol: split routines by hand
  if (sql.includes('DELIMITER $$')) {
    const [pre, rest] = sql.split('DELIMITER $$');
    const body = rest.split('DELIMITER ;')[0];
    await conn.query(pre);
    for (const stmt of body.split('$$').map((x) => x.trim()).filter(Boolean)) await conn.query(stmt);
  } else {
    await conn.query(sql);
  }
  console.log('Executed', f);
}
await conn.end();
console.log('Database ready.');
