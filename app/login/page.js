'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { Err, Field } from '@/components/ui';

export default function Login() {
  const [f, setF] = useState({ email: '', password: '' }), [err, setErr] = useState(''), router = useRouter();
  const submit = async (e) => { e.preventDefault(); try { await api('/api/auth/login', { method: 'POST', body: f }); router.push('/dashboard'); router.refresh(); } catch (x) { setErr(x.message); } };
  return (
    <div className="center card">
      <h1>🔧 AutoCare Login</h1>
      <Err msg={err} />
      <form onSubmit={submit} className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <Field label="Email"><input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <button>Sign in</button>
      </form>
      <p className="muted">New customer? <Link href="/register">Create an account</Link></p>
      <p className="muted">Demo: admin@autocare.com · ravi@autocare.com (Staff) · heema@example.com (Customer) — password <code>Password@123</code></p>
    </div>
  );
}
