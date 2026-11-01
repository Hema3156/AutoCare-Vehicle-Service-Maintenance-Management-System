'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Generic JSON form: posts to an API route, shows the server's validation message, refreshes data
export default function ApiForm({ action, method = 'POST', fields, submit = 'Save', redirect, onDoneText = 'Saved', compact = false }) {
  const router = useRouter();
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const form = new FormData(e.currentTarget);
    const data = {};
    for (const f of fields) if (f.type !== 'static') data[f.name] = form.get(f.name);
    const res = await fetch(action, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg({ err: true, text: json.error || 'Request failed' }); return; }
    if (redirect) { router.push(redirect); router.refresh(); return; }
    setMsg({ err: false, text: onDoneText }); e.target.reset(); router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className={compact ? 'row' : ''}>
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={f.name}>{f.label}</label>
            {f.type === 'select' ? (
              <select id={f.name} name={f.name} required={f.required} defaultValue={f.default ?? ''}>
                <option value="">{f.placeholder || 'Select...'}</option>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea id={f.name} name={f.name} required={f.required} maxLength={f.max || 1000} placeholder={f.placeholder} />
            ) : (
              <input id={f.name} name={f.name} type={f.type || 'text'} required={f.required} placeholder={f.placeholder}
                min={f.min} max={f.max} step={f.step} minLength={f.minLength} maxLength={f.maxLength} defaultValue={f.default} autoComplete={f.auto} />
            )}
          </div>
        ))}
        <button disabled={busy} style={compact ? undefined : { marginTop: 14 }}>{busy ? 'Please wait...' : submit}</button>
      </div>
      {msg && <div className={'msg ' + (msg.err ? 'err' : 'good')} role="status">{msg.text}</div>}
    </form>
  );
}
