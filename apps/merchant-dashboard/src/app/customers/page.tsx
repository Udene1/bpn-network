'use client';
import { useState } from 'react';

export default function CustomersPage() {
  const [hash, setHash] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [error, setError] = useState('');

  const handleLookup = () => {
    setCustomer(null);
    setError('');
    fetch(`http://localhost:3000/merchant/lookup-customer/${hash}`)
      .then(res => {
        if (!res.ok) throw new Error('Customer not found');
        return res.json();
      })
      .then(data => setCustomer(data))
      .catch(err => setError(err.message));
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Customer Directory</h1>
        <p style={{ color: '#94a3b8' }}>Verify buyer identity and loyalty status via fingerprint hash.</p>
      </header>

      <section className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Biometric Hash Lookup</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="glass" 
            placeholder="Enter template hash (e.g. SHA256...)"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            style={{ flex: 1, padding: '0.75rem 1rem', background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
          />
          <button 
            onClick={handleLookup}
            style={{ padding: '0.75rem 1.5rem', background: 'var(--accent-primary)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            Search
          </button>
        </div>
        {error && <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
      </section>

      {customer && (
        <div className="glass" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '40px', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
             👤
          </div>
          <div style={{ flex: 1 }}>
             <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>{customer.maskedName}</h2>
             <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>{customer.bankName} Account Holder</p>
             <div style={{ display: 'flex', gap: '1rem' }}>
                <span className="pill pill-success">VERIFIED</span>
                <span className="pill" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>Loyalty Tier: GOLD</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
