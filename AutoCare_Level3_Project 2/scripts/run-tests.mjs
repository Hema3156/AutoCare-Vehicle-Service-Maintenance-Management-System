// Integration tests: run against a live app (npm run build && npm start, then npm test).
// Usage: BASE_URL=http://localhost:3000 npm test      (DB should be freshly seeded: npm run db:setup -- --reset)
import fs from 'node:fs';
import mysql from 'mysql2/promise';
import { loadEnv } from './env.mjs';
loadEnv();
const BASE = process.env.BASE_URL || 'http://localhost:3000';

class Client {
  constructor() { this.cookie = ''; }
  async req(method, url, body) {
    const res = await fetch(BASE + url, { method, redirect: 'manual', headers: { 'Content-Type': 'application/json', Cookie: this.cookie }, body: body ? JSON.stringify(body) : undefined });
    const sc = res.headers.get('set-cookie'); if (sc) this.cookie = sc.split(';')[0];
    let json = {}; try { json = await res.json(); } catch {}
    return { status: res.status, json };
  }
  async login(email, password = 'Password@123') { return this.req('POST', '/api/auth/login', { email, password }); }
}

const results = [];
async function test(id, name, fn) {
  try { const out = await fn(); results.push({ id, name, pass: out === true, detail: out === true ? '' : String(out) }); }
  catch (e) { results.push({ id, name, pass: false, detail: 'Exception: ' + e.message }); }
}
const eq = (a, b) => (a === b ? true : `expected ${b}, got ${a}`);

const db = await mysql.createConnection({ host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_ADMIN_USER || process.env.MYSQL_USER, password: process.env.MYSQL_ADMIN_PASSWORD ?? process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE });
const q = async (sql, p = []) => (await db.query(sql, p))[0];

const admin = new Client(), staff1 = new Client(), staff2 = new Client(), cust = new Client(), anon = new Client(), newc = new Client();
const pad = (n) => String(n).padStart(2, '0');
const slot = (days, h) => { const d = new Date(Date.now() + days * 864e5); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:00`; };

// ---------- Authentication ----------
await test('T01', 'Login with correct credentials succeeds', async () => eq((await admin.login('admin@autocare.in')).status, 200));
await test('T02', 'Login with wrong password is rejected (401)', async () => eq((await anon.login('admin@autocare.in', 'wrong')).status, 401));
await test('T03', 'SQL-injection style email is rejected (401)', async () => eq((await anon.login("' OR 1=1 --", 'x')).status, 401));
await test('T04', 'Unauthenticated API call is rejected (401)', async () => eq((await new Client().req('GET', '/api/vehicles')).status, 401));
await test('T05', 'Passwords are stored as bcrypt hashes', async () => {
  const [r] = await q('SELECT Password_Hash FROM USER_ACCOUNT WHERE Email=?', ['admin@autocare.in']); return r.Password_Hash.startsWith('$2') ? true : 'not bcrypt'; });
await staff1.login('ravi@autocare.in'); await staff2.login('sneha@autocare.in'); await cust.login('priya@example.com');
await test('T06', 'Registration rejects weak password (400)', async () => eq((await newc.req('POST', '/api/auth/register', { name: 'Test User', email: 'tu@example.com', password: 'abc' })).status, 400));
await test('T07', 'Customer registration succeeds (201)', async () => eq((await newc.req('POST', '/api/auth/register', { name: 'Test User', email: 'tu@example.com', phone: '9999999999', password: 'Secret123' })).status, 201));
await test('T08', 'Duplicate email registration returns 409 (UNIQUE)', async () => eq((await new Client().req('POST', '/api/auth/register', { name: 'Dup', email: 'tu@example.com', password: 'Secret123' })).status, 409));

// ---------- Authorization ----------
await test('T09', 'Customer cannot read inventory API (403)', async () => eq((await cust.req('GET', '/api/parts')).status, 403));
await test('T10', 'Customer cannot create staff (403)', async () => eq((await cust.req('POST', '/api/staff', {})).status, 403));
await test('T11', 'Staff cannot create service types (403)', async () => eq((await staff1.req('POST', '/api/services', {})).status, 403));
await test('T12', "Customer cannot cancel another customer's appointment (403)", async () => eq((await cust.req('PATCH', '/api/appointments/3', { status: 'Cancelled' })).status, 403));
await test('T13', "Customer sees only own appointments", async () => {
  const r = await cust.req('GET', '/api/appointments'); return r.json.appointments.every((a) => a.Customer_Name === 'Priya Nair') ? true : 'leak'; });

// ---------- DB-level validation ----------
await test('T14', 'CHECK constraint rejects vehicle year 1900 (400)', async () => eq((await cust.req('POST', '/api/vehicles', { registration_no: 'KA99ZZ0001', make: 'A', model: 'B', year: 1900 })).status, 400));
await test('T15', 'CHECK constraint rejects invalid fuel type (400)', async () => eq((await cust.req('POST', '/api/vehicles', { registration_no: 'KA99ZZ0002', make: 'A', model: 'B', year: 2020, fuel_type: 'Steam' })).status, 400));
await test('T16', 'UNIQUE constraint rejects duplicate registration (409)', async () => eq((await cust.req('POST', '/api/vehicles', { registration_no: 'KA01AB1234', make: 'A', model: 'B', year: 2020 })).status, 409));
await test('T17', 'Valid vehicle is accepted (201)', async () => eq((await cust.req('POST', '/api/vehicles', { registration_no: 'KA99ZZ0003', make: 'Tata', model: 'Tiago', year: 2021, fuel_type: 'Petrol' })).status, 201));
await test('T18', 'Direct SQL: negative price rejected by CHECK', async () => { try { await q("INSERT INTO SERVICE_TYPE (Service_Name, Base_Price) VALUES ('Bad', -5)"); return 'inserted'; } catch (e) { return eq([3819, 4025].includes(e.errno), true); } });
await test('T19', 'Direct SQL: invalid role rejected by CHECK', async () => { try { await q("INSERT INTO USER_ACCOUNT (Name,Email,Password_Hash,Role) VALUES ('x','x@x.com','h','Hacker')"); return 'inserted'; } catch (e) { return eq([3819, 4025].includes(e.errno), true); } });
await test('T20', 'Direct SQL: payment to missing appointment rejected by FK', async () => { try { await q("INSERT INTO PAYMENT (Appointment_ID,Amount,Payment_Method,Payment_Status) VALUES (9999,10,'Cash','Completed')"); return 'inserted'; } catch (e) { return eq(e.code, 'ER_NO_REFERENCED_ROW_2'); } });

// ---------- Appointments / procedures ----------
const vehicle = (await cust.req('GET', '/api/vehicles')).json.vehicles[0].Vehicle_ID;
await test('T21', 'Booking in the past is rejected by stored procedure (400)', async () => eq((await cust.req('POST', '/api/appointments', { vehicle_id: vehicle, service_id: 1, datetime: '2020-01-01T10:00' })).status, 400));
await test('T22', "Booking another customer's vehicle is forbidden (403)", async () => eq((await cust.req('POST', '/api/appointments', { vehicle_id: 3, service_id: 1, datetime: slot(20, 10) })).status, 403));
let newAppt;
await test('T23', 'Valid booking succeeds via sp_book_appointment (201)', async () => { const r = await cust.req('POST', '/api/appointments', { vehicle_id: vehicle, service_id: 1, datetime: slot(20, 10), problem: 'Test oil change' }); newAppt = r.json.id; return eq(r.status, 201); });
await test('T24', 'Admin double-booking a mechanic is rejected (400)', async () => {
  const r = await admin.req('POST', '/api/appointments', { vehicle_id: vehicle, service_id: 1, staff_id: 1, datetime: slot(2, 10) }); return eq(r.status, 400) });
await test('T25', 'Only admin can assign mechanics (403 for staff)', async () => eq((await staff1.req('PATCH', `/api/appointments/${newAppt}`, { staff_id: 1 })).status, 403));
await test('T26', 'Admin assigns mechanic (200)', async () => eq((await admin.req('PATCH', `/api/appointments/${newAppt}`, { staff_id: 2 })).status, 200));
await test('T27', 'Assigned staff starts work (200)', async () => eq((await staff2.req('PATCH', `/api/appointments/${newAppt}`, { status: 'In Progress' })).status, 200));
await test('T28', 'Other mechanic cannot work on the job (403)', async () => eq((await staff1.req('POST', `/api/appointments/${newAppt}/complete`, { labor: 100 })).status, 403));

// ---------- Transactions, triggers ----------
const [{ s: stockBefore }] = await q('SELECT Stock_Qty AS s FROM SPARE_PART WHERE Part_ID=8');
await test('T29', 'Completion with insufficient stock fails and rolls back (400)', async () => {
  const r = await staff2.req('POST', `/api/appointments/${newAppt}/complete`, { labor: 200, parts: [{ part_id: 1, quantity: 1 }, { part_id: 8, quantity: 99 }] });
  const [a] = await q('SELECT Status FROM APPOINTMENT WHERE Appointment_ID=?', [newAppt]);
  const [{ n }] = await q('SELECT COUNT(*) n FROM SERVICE_RECORD WHERE Appointment_ID=?', [newAppt]);
  const [{ s }] = await q('SELECT Stock_Qty AS s FROM SPARE_PART WHERE Part_ID=1');
  return r.status === 400 && a.Status === 'In Progress' && n === 0 ? true : `status=${r.status} appt=${a.Status} records=${n}`; });
const [{ oil }] = await q('SELECT Stock_Qty AS oil FROM SPARE_PART WHERE Part_ID=1');
await test('T30', 'Completion succeeds: record, parts, invoice created (200)', async () => {
  const r = await staff2.req('POST', `/api/appointments/${newAppt}/complete`, { labor: 300, inspection: 'ok', diagnosis: 'routine', parts: [{ part_id: 1, quantity: 1 }, { part_id: 2, quantity: 2 }] });
  return eq(r.status, 200); });
await test('T31', 'Trigger deducted stock for parts used', async () => { const [{ s }] = await q('SELECT Stock_Qty AS s FROM SPARE_PART WHERE Part_ID=1'); return eq(s, oil - 1); });
await test('T32', 'Trigger computed Total_Cost = labour + parts (300 + 1850 + 2x350 = 2850)', async () => { const [r] = await q('SELECT Total_Cost c FROM SERVICE_RECORD WHERE Appointment_ID=?', [newAppt]); return eq(Number(r.c), 2850); });
await test('T33', 'Invoice has 18% tax (Total 3363.00)', async () => { const [r] = await q('SELECT Total_Amount t, Tax x FROM INVOICE WHERE Appointment_ID=?', [newAppt]); return r.t === '3363.00' && r.x === '513.00' ? true : JSON.stringify(r); });
await test('T34', 'Appointment now Completed', async () => { const [r] = await q('SELECT Status s FROM APPOINTMENT WHERE Appointment_ID=?', [newAppt]); return eq(r.s, 'Completed'); });
await test('T35', 'Completed appointment cannot be re-completed (400)', async () => eq((await staff2.req('POST', `/api/appointments/${newAppt}/complete`, { labor: 1 })).status, 400));
await test('T36', 'Trigger blocks status change of a completed appointment (400)', async () => eq((await admin.req('PATCH', `/api/appointments/${newAppt}`, { status: 'Cancelled' })).status, 400));
await test('T37', 'Inventory log row written by trigger', async () => { const [r] = await q("SELECT COUNT(*) n FROM INVENTORY_LOG WHERE Reason='Used in service' AND Part_ID=2"); return r.n >= 2 ? true : 'no log'; });

// ---------- Payments ----------
await test('T38', 'Payment above balance is rejected (400)', async () => eq((await cust.req('POST', '/api/payments', { appointment_id: newAppt, amount: 5000, method: 'UPI' })).status, 400));
await test('T39', 'Negative payment rejected (400)', async () => eq((await cust.req('POST', '/api/payments', { appointment_id: newAppt, amount: -5, method: 'UPI' })).status, 400));
await test('T40', 'Partial payment sets invoice Partially Paid', async () => {
  const r = await cust.req('POST', '/api/payments', { appointment_id: newAppt, amount: 1000, method: 'UPI' });
  const [i] = await q('SELECT Status s FROM INVOICE WHERE Appointment_ID=?', [newAppt]); return r.status === 201 && i.s === 'Partially Paid' ? true : `${r.status} ${i.s}`; });
await test('T41', 'Remaining payment sets invoice Paid; fn_invoice_balance = 0', async () => {
  await cust.req('POST', '/api/payments', { appointment_id: newAppt, amount: 2363, method: 'Card' });
  const [i] = await q('SELECT Status s, fn_invoice_balance(?) b FROM INVOICE WHERE Appointment_ID=?', [newAppt, newAppt]); return i.s === 'Paid' && Number(i.b) === 0 ? true : JSON.stringify(i); });
await test('T42', "Customer cannot pay someone else's invoice (403)", async () => eq((await cust.req('POST', '/api/payments', { appointment_id: 3, amount: 10, method: 'UPI' })).status, 403));

// ---------- Integrity, search, pages ----------
await test('T43', 'Deleting a service with appointments is blocked (409, FK RESTRICT)', async () => eq((await admin.req('DELETE', '/api/services/1')).status, 409));
await test('T44', 'Deleting a customer cascades to vehicles (ON DELETE CASCADE)', async () => {
  const [u] = await q("SELECT User_ID FROM USER_ACCOUNT WHERE Email='tu@example.com'");
  await q('INSERT INTO VEHICLE (Customer_ID,Registration_No,Make,Model) SELECT Customer_ID,"CAS0001","X","Y" FROM CUSTOMER WHERE User_ID=?', [u.User_ID]);
  await q('DELETE FROM USER_ACCOUNT WHERE User_ID=?', [u.User_ID]);
  const [r] = await q('SELECT COUNT(*) n FROM VEHICLE WHERE Registration_No="CAS0001"'); return eq(r.n, 0); });
await test('T45', 'Full-text search finds brake problems', async () => { const r = await admin.req('GET', '/api/search?q=brake'); return r.status === 200 && r.json.appointments.length > 0 ? true : JSON.stringify(r.json).slice(0, 100); });
await test('T46', 'Restock procedure increases stock (admin)', async () => {
  const [{ a }] = await q('SELECT Stock_Qty a FROM SPARE_PART WHERE Part_ID=3'); const r = await admin.req('POST', '/api/parts', { action: 'restock', part_id: 3, quantity: 5 });
  const [{ b }] = await q('SELECT Stock_Qty b FROM SPARE_PART WHERE Part_ID=3'); return r.status === 200 && b === a + 5 ? true : `${r.status} ${a}->${b}`; });
await test('T47', 'Restock with zero quantity rejected (400)', async () => eq((await admin.req('POST', '/api/parts', { action: 'restock', part_id: 3, quantity: 0 })).status, 400));
for (const [who, c, url] of [['Admin', admin, '/dashboard'], ['Admin', admin, '/reports'], ['Staff', staff1, '/appointments'], ['Customer', cust, '/billing'], ['Customer', cust, '/vehicles']]) {
  await test('P' + results.length, `${who} page ${url} renders (200)`, async () => { const r = await fetch(BASE + url, { headers: { Cookie: c.cookie } }); return eq(r.status, 200); });
}
await test('T48', 'Unauthenticated page request redirects to /login', async () => { const r = await fetch(BASE + '/dashboard', { redirect: 'manual' }); return r.status >= 300 && r.status < 400 && r.headers.get('location').includes('/login') ? true : r.status; });
await test('T49', 'Customer is redirected away from admin-only /reports', async () => { const r = await fetch(BASE + '/reports', { headers: { Cookie: cust.cookie }, redirect: 'manual' }); return r.status >= 300 && r.status < 400 ? true : r.status; });

await db.end();
const pass = results.filter((r) => r.pass).length;
let md = `# AutoCare Test Results\n\nRun: ${new Date().toISOString()}  |  ${pass}/${results.length} passed\n\n| ID | Test case | Result |\n|----|-----------|--------|\n`;
for (const r of results) md += `| ${r.id} | ${r.name} | ${r.pass ? 'PASS' : 'FAIL ' + r.detail} |\n`;
fs.writeFileSync('docs/test-results.md', md);
console.log(md);
process.exit(pass === results.length ? 0 : 1);
