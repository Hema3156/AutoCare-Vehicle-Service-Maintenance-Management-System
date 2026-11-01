import { query } from './db';
import { HttpError } from './api';

// Loads an appointment and enforces ownership for customers.
export async function loadAppointment(id, s) {
  const [a] = await query('SELECT * FROM vw_appointment_details WHERE Appointment_ID = ?', [id]);
  if (!a) throw new HttpError(404, 'Appointment not found');
  if (s.role === 'Customer' && a.Customer_ID !== s.customerId) throw new HttpError(403, 'Not your appointment');
  return a;
}
