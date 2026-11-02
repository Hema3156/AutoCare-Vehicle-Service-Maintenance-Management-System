import Link from 'next/link';
import ApiForm from '@/components/ApiForm';
export default function Register() {
  return (
    <div className="center card">
      <h1>Create customer account</h1>
      <ApiForm action="/api/auth/register" submit="Register" redirect="/dashboard" fields={[
        { name: 'name', label: 'Full name', required: true, maxLength: 100 },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone (10-15 digits)', maxLength: 15 },
        { name: 'address', label: 'Address', maxLength: 255 },
        { name: 'password', label: 'Password (8+ chars, letters and numbers)', type: 'password', required: true, minLength: 8, auto: 'new-password' }]} />
      <p className="muted mt">Already registered? <Link href="/login">Log in</Link></p>
    </div>
  );
}
