'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { Err, Field } from '@/components/ui';

export default function Register() {
  const [f, setF] = useState({ name: '', email: '', phone: '', address: '', password: '' }), [err, setErr] = useState(''), router = useRouter();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => { e.preventDefault(); try { await api('/api/auth/register', { method: 'POST', body: f }); router.push('/login'); } catch (x) { setErr(x.message); } };
  return (
    <div className="center card">
      <h1>Create customer account</h1>
      <Err msg={err} />
      <form onSubmit={submit} className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <Field label="Full name"><input required value={f.name} onChange={set('name')} /></Field>
        <Field label="Email"><input type="email" required value={f.email} onChange={set('email')} /></Field>
        <Field label="Phone (10-15 digits)"><input value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Address"><input value={f.address} onChange={set('address')} /></Field>
        <Field label="Password (min 8 chars)"><input type="password" minLength={8} required value={f.password} onChange={set('password')} /></Field>
        <button>Register</button>
      </form>
      <p className="muted">Already registered? <Link href="/login">Sign in</Link></p>
    </div>
  );
}
