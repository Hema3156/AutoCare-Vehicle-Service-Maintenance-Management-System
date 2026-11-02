export default function Badge({ v }) { return <span className={'badge b-' + v}>{v}</span>; }
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dt = (s) => (s ? String(s).replace('T', ' ').slice(0, 16) : '');
