'use client';
import { useState } from 'react';
import { api, useApi, fmt } from '@/lib/client';
import { Err, Ok, Field } from '@/components/ui';

export default function Users() {
  const { data, error, reload } = useApi('/api/users');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', role: 'Staff', designation: 'Mechanic' }), [msg, setMsg] = useState(''), [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const run = async (fn, ok) => { try { await fn(); setMsg(ok); setErr(''); reload(); } catch (x) { setErr(x.message); setMsg(''); } };
  return (
    <>
      <h1>User management</h1><Err msg={error || err} /><Ok msg={msg} />
      <div className="card"><h2>Create staff / admin</h2>
        <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => api('/api/users', { method: 'POST', body: f }), 'User created'); }}>
          <Field label="Name"><input required value={f.name} onChange={set('name')} /></Field><Field label="Email"><input type="email" required value={f.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input value={f.phone} onChange={set('phone')} /></Field><Field label="Password"><input type="password" minLength={8} required value={f.password} onChange={set('password')} /></Field>
          <Field label="Role"><select value={f.role} onChange={set('role')}><option>Staff</option><option>Admin</option></select></Field>
          {f.role === 'Staff' && <Field label="Designation"><input value={f.designation} onChange={set('designation')} /></Field>}<button>Create</button></form></div>
      <div className="card"><table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Active</th></tr></thead><tbody>
        {data?.map((u) => <tr key={u.User_ID}><td>{u.User_ID}</td><td>{u.Name}</td><td>{u.Email}</td><td>{u.Role}</td><td>{fmt(u.Created_At)}</td>
          <td><button className={`sm ${u.Is_Active ? 'alt' : ''}`} onClick={() => run(() => api('/api/users', { method: 'PATCH', body: { userId: u.User_ID, active: !u.Is_Active } }), 'Updated')}>{u.Is_Active ? 'Active – disable' : 'Disabled – enable'}</button></td></tr>)}
      </tbody></table></div>
    </>
  );
}
