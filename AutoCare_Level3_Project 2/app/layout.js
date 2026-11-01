import './globals.css';
import Nav from '@/components/Nav';
import { getSession } from '@/lib/auth';

export const metadata = { title: 'AutoCare - Vehicle Service & Maintenance', description: 'DBMS Level 3 mini project' };
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const session = await getSession();
  return (
    <html lang="en"><body>
      {session && <Nav session={session} />}
      <main>{children}</main>
    </body></html>
  );
}
