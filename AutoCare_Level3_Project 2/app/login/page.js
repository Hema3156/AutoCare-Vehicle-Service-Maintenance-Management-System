import Link from 'next/link';
import ApiForm from '@/components/ApiForm';
export default function Login() {
  return (
    <div className="center card">
      <h1>AutoCare Login</h1>
      <ApiForm action="/api/auth/login" submit="Log in" redirect="/dashboard" fields={[
        { name: 'email', label: 'Email', type: 'email', required: true, auto: 'username' },
        { name: 'password', label: 'Password', type: 'password', required: true, auto: 'current-password' }]} />
      <p className="muted mt">New customer? <Link href="/register">Create an account</Link></p>
    </div>
  );
}
