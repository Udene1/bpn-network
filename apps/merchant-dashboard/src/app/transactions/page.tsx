'use client';
import { useEffect, useState } from 'react';

export default function TransactionsPage() {
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/merchant/transactions')
      .then(res => res.json())
      .then(data => setTxns(data));
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Transaction History</h1>
        <p style={{ color: '#94a3b8' }}>Comprehensive log of all biometric payments across your network.</p>
      </header>

      <section className="glass" style={{ padding: '2rem' }}>
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
            {txns.map(tx => (
              <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1.25rem 0' }}>{tx.buyer?.fullName || 'Guest'}</td>
                <td style={{ color: '#94a3b8' }}>{tx.bankReference}</td>
                <td style={{ fontWeight: 600 }}>₦{tx.amount.toLocaleString()}</td>
                <td><span className={`pill pill-${tx.status.toLowerCase() == 'completed' ? 'success' : 'pending'}`}>{tx.status}</span></td>
                <td style={{ color: '#64748b' }}>{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
