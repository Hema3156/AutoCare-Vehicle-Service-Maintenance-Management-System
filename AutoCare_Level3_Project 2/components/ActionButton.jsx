'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ActionButton({ url, method = 'PATCH', payload, label, confirm, className = 'sec' }) {
  const router = useRouter();
  const [err, setErr] = useState('');
  async function go() {
    if (confirm && !window.confirm(confirm)) return;
    setErr('');
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {}) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(json.error || 'Failed'); return; }
    router.refresh();
  }
  return <span><button type="button" className={className} onClick={go}>{label}</button>{err && <span className="msg err" style={{ marginLeft: 8 }}>{err}</span>}</span>;
}
