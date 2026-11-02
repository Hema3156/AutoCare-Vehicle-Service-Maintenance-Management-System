import Link from 'next/link';
import LogoutButton from './LogoutButton';

const LINKS = {
  Admin: [['dashboard', 'Dashboard'], ['appointments', 'Appointments'], ['vehicles', 'Vehicles'], ['services', 'Services'], ['parts', 'Inventory'], ['billing', 'Billing'], ['staff', 'Staff'], ['reports', 'Reports'], ['search', 'Search']],
  Staff: [['dashboard', 'Dashboard'], ['appointments', 'My Jobs'], ['parts', 'Inventory'], ['billing', 'Billing'], ['search', 'Search']],
  Customer: [['dashboard', 'Dashboard'], ['vehicles', 'My Vehicles'], ['appointments', 'Appointments'], ['billing', 'Invoices'], ['feedback', 'Feedback'], ['search', 'Search']],
};

export default function Nav({ session }) {
  return (
    <header className="nav">
      <span className="brand">AutoCare</span>
      {(LINKS[session.role] || []).map(([h, l]) => <Link key={h} href={'/' + h}>{l}</Link>)}
      <span className="spacer" />
      <span className="who">{session.name} ({session.role})</span>
      <LogoutButton />
    </header>
  );
}
