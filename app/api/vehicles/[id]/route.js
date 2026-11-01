import { query } from '@/lib/db';
import { body, route, HttpError } from '@/lib/api';

export const dynamic = 'force-dynamic';
async function ownVehicle(id, s) {
  const [v] = await query('SELECT * FROM VEHICLE WHERE Vehicle_ID = ?', [id]);
  if (!v) throw new HttpError(404, 'Vehicle not found');
  if (s.role === 'Customer' && v.Customer_ID !== s.customerId) throw new HttpError(403, 'Not your vehicle');
  return v;
}
export const PUT = route([], async (req, { params }, s) => {
  await ownVehicle(params.id, s);
  const b = await body(req);
  await query('UPDATE VEHICLE SET Make=?, Model=?, Year=?, Fuel_Type=?, Odometer_KM=? WHERE Vehicle_ID=?',
    [b.make, b.model, b.year || null, b.fuel || 'Petrol', b.odometer || 0, params.id]);
  return { ok: true };
});
export const DELETE = route([], async (req, { params }, s) => {
  await ownVehicle(params.id, s);
  await query('DELETE FROM VEHICLE WHERE Vehicle_ID = ?', [params.id]); // FK RESTRICT blocks if it has appointments
  return { ok: true };
});
