// Runs the 5 SQL files in order (understands DELIMITER). Usage: npm run db:setup
const fs = require('fs'), path = require('path'), mysql = require('mysql2/promise');
require('fs').existsSync('.env.local') && fs.readFileSync('.env.local', 'utf8').split('\n').forEach((l) => {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
});
function split(sql) {
  const out = []; let delim = ';', buf = '';
  for (const line of sql.split('\n')) {
    const d = line.match(/^DELIMITER\s+(\S+)/i);
    if (d) { delim = d[1]; continue; }
    if (/^\s*--/.test(line)) continue;
    buf += line + '\n';
    if (buf.trimEnd().endsWith(delim)) { out.push(buf.trimEnd().slice(0, -delim.length)); buf = ''; }
  }
  if (buf.trim()) out.push(buf);
  return out.map((s) => s.trim()).filter(Boolean);
}
(async () => {
  const conn = await mysql.createConnection({ host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD, multipleStatements: false });
  const files = fs.readdirSync(path.join(__dirname, '../database')).filter((f) => /^0[1-4].*\.sql$/.test(f)).sort();
  for (const f of files) {
    const stmts = split(fs.readFileSync(path.join(__dirname, '../database', f), 'utf8'));
    for (const s of stmts) await conn.query(s);
    console.log(`OK  ${f} (${stmts.length} statements)`);
  }
  await conn.end();
  console.log('Database ready. Demo logins use password: Password@123');
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
