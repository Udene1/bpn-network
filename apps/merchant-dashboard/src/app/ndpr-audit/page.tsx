'use client';

export default function NDPRAuditPage() {
  const handleExport = () => {
    window.open('http://localhost:3000/merchant/ndpr-export');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Compliance & Audit</h1>
        <p style={{ color: '#94a3b8' }}>Secure logs and data protection reports (NDPR).</p>
      </header>

      <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>📄</div>
        <h2 style={{ marginBottom: '1rem' }}>Export Audit Trails</h2>
        <p style={{ color: '#94a3b8', maxWidth: 500, margin: '0 auto 2rem' }}>
          Download a complete CSV of all user consents, biometric enrollment events, and payment authorizations for regulatory compliance.
        </p>
        <button onClick={handleExport} className="glass" style={{ padding: '1rem 2rem', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer' }}>
          Download Full CSV Log
        </button>
      </div>
    </div>
  );
}
