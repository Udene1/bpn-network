'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div style={{ width: 32, height: 32, background: 'var(--accent-primary)', borderRadius: 8 }}></div>
        BPN HUB
      </div>
      <nav>
        <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Dashboard</Link>
        <Link href="/transactions" className={`nav-link ${isActive('/transactions') ? 'active' : ''}`}>Transactions</Link>
        <Link href="/customers" className={`nav-link ${isActive('/customers') ? 'active' : ''}`}>Customers</Link>
        <Link href="/pos-devices" className={`nav-link ${isActive('/pos-devices') ? 'active' : ''}`}>POS Devices</Link>
        <Link href="/ndpr-audit" className={`nav-link ${isActive('/ndpr-audit') ? 'active' : ''}`}>NDPR Audit</Link>
        <Link href="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>Settings</Link>
      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Logged in as</div>
        <div style={{ fontWeight: 600 }}>Iya Basira Store</div>
      </div>
    </aside>
  );
}
