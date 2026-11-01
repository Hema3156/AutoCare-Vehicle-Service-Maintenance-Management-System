import { MongoClient } from 'mongodb';

const g = globalThis;

export async function mongoDb() {
  if (!process.env.MONGODB_URI) throw new Error('Missing environment variable MONGODB_URI');
  if (!g.__mongoClient) {
    g.__mongoClient = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 3000 }).connect();
  }
  let client;
  try { client = await g.__mongoClient; }
  catch (e) { g.__mongoClient = null; g.__mongoIndexes = null; throw e; }   // retry on next call
  const db = client.db(process.env.MONGODB_DB || 'autocare');
  if (!g.__mongoIndexes) { g.__mongoIndexes = ensureIndexes(db).catch(() => {}); }
  await g.__mongoIndexes;
  return db;
}

export async function ensureIndexes(db) {
  await db.collection('feedback').createIndex({ appointment_id: 1 }, { unique: true });
  await db.collection('feedback').createIndex({ service_id: 1, rating: -1 });
  await db.collection('feedback').createIndex({ staff_id: 1 });
  await db.collection('feedback').createIndex({ comment: 'text', tags: 'text' });
  await db.collection('inspection_checklists').createIndex({ appointment_id: 1 }, { unique: true });
  await db.collection('inspection_checklists').createIndex({ vehicle_id: 1, created_at: -1 });
  await db.collection('inspection_checklists').createIndex({ 'items.status': 1 });
  await db.collection('audit_logs').createIndex({ ts: -1 });
  await db.collection('audit_logs').createIndex({ ts: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // TTL 90 days
}

// Best effort: audit logging must never break a business transaction
export async function audit(actor, action, entity, details = {}) {
  try {
    const db = await mongoDb();
    await db.collection('audit_logs').insertOne({ ts: new Date(), actor, action, entity, details });
  } catch { /* Mongo unavailable: ignore */ }
}
