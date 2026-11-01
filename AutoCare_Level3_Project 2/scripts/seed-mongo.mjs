// Seeds MongoDB sample documents (feedback + inspection checklists) and indexes. npm run db:seed-mongo
import { MongoClient } from 'mongodb';
import { loadEnv } from './env.mjs';
loadEnv();
const client = await MongoClient.connect(process.env.MONGODB_URI);
const db = client.db(process.env.MONGODB_DB || 'autocare');
await db.dropDatabase();

await db.collection('feedback').createIndex({ appointment_id: 1 }, { unique: true });
await db.collection('feedback').createIndex({ service_id: 1, rating: -1 });
await db.collection('feedback').createIndex({ staff_id: 1 });
await db.collection('feedback').createIndex({ comment: 'text', tags: 'text' });
await db.collection('inspection_checklists').createIndex({ appointment_id: 1 }, { unique: true });
await db.collection('inspection_checklists').createIndex({ vehicle_id: 1, created_at: -1 });
await db.collection('inspection_checklists').createIndex({ 'items.status': 1 });
await db.collection('audit_logs').createIndex({ ts: -1 });
await db.collection('audit_logs').createIndex({ ts: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const d = (s) => new Date(s);
await db.collection('feedback').insertMany([
  { appointment_id: 1, customer_id: 1, service_id: 1, service_name: 'Oil Change', staff_id: 1, rating: 5, comment: 'Quick and clean oil change, done in under an hour.', tags: ['fast', 'clean'], created_at: d('2026-07-13') },
  { appointment_id: 2, customer_id: 1, service_id: 2, service_name: 'Brake Pad Replacement', staff_id: 2, rating: 4, comment: 'Brake noise fixed. Pricing was fair but pickup was delayed.', tags: ['fair price', 'delay'], created_at: d('2026-07-21') },
  { appointment_id: 3, customer_id: 2, service_id: 3, service_name: 'Full Service', staff_id: 1, rating: 5, comment: 'Thorough full service with a detailed checklist. Very professional.', tags: ['professional', 'thorough'], created_at: d('2026-08-06') },
  { appointment_id: 4, customer_id: 3, service_id: 4, service_name: 'AC Repair', staff_id: 3, rating: 3, comment: 'AC cooling is better but the repair took longer than estimated.', tags: ['delay'], created_at: d('2026-08-19') },
  { appointment_id: 5, customer_id: 3, service_id: 5, service_name: 'Battery Replacement', staff_id: 2, rating: 5, comment: 'New battery installed quickly, car starts instantly.', tags: ['fast', 'fair price'], created_at: d('2026-09-03') },
]);
const item = (name, status, notes = '') => ({ name, status, notes });
await db.collection('inspection_checklists').insertMany([
  { appointment_id: 2, service_record_id: 2, vehicle_id: 2, items: [item('Brakes', 'Replaced', 'Front pads at 2mm'), item('Tyres', 'Needs Attention', 'Rear tyres wearing unevenly'), item('Lights', 'OK')], readings: { odometer_km: 42110, battery_voltage: 12.6 }, created_by: 'Sneha Rao', created_at: d('2026-07-20') },
  { appointment_id: 3, service_record_id: 3, vehicle_id: 3, items: [item('Engine oil', 'Replaced'), item('Coolant', 'OK'), item('Suspension', 'Needs Attention', 'Front left bush cracked'), item('Tyres', 'OK')], readings: { odometer_km: 61350, battery_voltage: 12.4 }, created_by: 'Ravi Kumar', created_at: d('2026-08-05') },
  { appointment_id: 5, service_record_id: 5, vehicle_id: 5, items: [item('Battery', 'Replaced', 'Old battery 10.8V'), item('Lights', 'Needs Attention', 'Left headlamp dim')], readings: { odometer_km: 98800, battery_voltage: 12.7 }, created_by: 'Sneha Rao', created_at: d('2026-09-02') },
]);
console.log('MongoDB seeded.');
await client.close();
