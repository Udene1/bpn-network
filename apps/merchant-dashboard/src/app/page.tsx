'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({ totalVolume: 0, activeUsers: 0, successRate: '0%' });
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.verimut.icu';
    
    fetch(`${apiUrl}/merchant/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Stats fetch failed:', err));

    fetch(`${apiUrl}/merchant/transactions`)
      .then(res => res.json())
      .then(data => setTxns(data))
      .catch(err => console.error('Transactions fetch failed:', err));
  }, []);

  const handleExport = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.verimut.icu';
    window.open(`${apiUrl}/merchant/ndpr-export`);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome back, Basira</h1>
          <p style={{ color: '#94a3b8' }}>Here's what happened with your payments today.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleExport} className="glass" style={{ padding: '0.75rem 1.5rem', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>
            Download NDPR Audit
          </button>
          <div className="glass" style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '1rem' }}>
            <span style={{ color: '#10b981' }}>● System Online</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass stat-card">
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Total Sales (Today)</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700 }}>₦{stats.totalVolume?.toLocaleString() || '0'}</h2>
          <p style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.5rem' }}>+12% from yesterday</p>
        </div>
        <div className="glass stat-card">
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Enrolled Buyers</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.activeUsers}</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>NDPR Consents Logged</p>
        </div>
        <div className="glass stat-card">
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>Biometric Success</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.successRate}</h2>
          <p style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.5rem' }}>Optimized capture mode</p>
        </div>
      </div>

      <section className="glass" style={{ padding: '2rem', marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '2rem' }}>7-Day Revenue Trend</h3>
        <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: '5%', padding: '0 1rem' }}>
          {(stats.chartData || []).map((day: any, i: number) => {
            const volume = Number(day?.volume) || 0;
            const total = Number(stats?.totalVolume) || 10000;
            const height = (volume / total) * 100 + 10;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                   width: '100%', 
                   height: `${Math.min(height, 100)}%`, 
                   background: 'linear-gradient(to top, var(--accent-primary), var(--accent-secondary))',
                   borderRadius: '6px 6px 0 0',
                   opacity: 0.8
                }} />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{day?.date?.split('-')[2] || '?'}/{day?.date?.split('-')[1] || '?'}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Recent Transactions</h3>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}>View All</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1rem 0' }}>CUSTOMER</th>
              <th>REF</th>
              <th>AMOUNT</th>
              <th>STATUS</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {txns?.map(tx => (
              <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1.25rem 0' }}>{tx.buyer?.fullName || 'Guest'}</td>
                <td style={{ color: '#94a3b8' }}>{tx.bankReference}</td>
                <td style={{ fontWeight: 600 }}>₦{tx.amount?.toLocaleString() || '0'}</td>
                <td><span className={`pill pill-${tx.status?.toLowerCase() == 'completed' ? 'success' : 'pending'}`}>{tx.status}</span></td>
                <td style={{ color: '#64748b' }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : 'N/A'}</td>
              </tr>
            ))}
            {txns.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No recent transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
