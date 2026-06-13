export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Merchant Settings</h1>
        <p style={{ color: '#94a3b8' }}>Configure your profile and settlement accounts.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Business Profile</h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>BUSINESS NAME</label>
            <input disabled value="Iya Basira Store" style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>TIN / REGISTRATION NO.</label>
            <input value="RC-99228811" style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }} />
          </div>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Settlement Bank Details</h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>BANK NAME</label>
            <select style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }}>
              <option>Access Bank</option>
              <option>GT Bank</option>
              <option>Zenith Bank</option>
              <option>First Bank</option>
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>ACCOUNT NUMBER</label>
            <input value="0011223344" style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>ACCOUNT NAME</label>
            <input disabled value="BASIRA IYA ENTERPRISE" style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--glass-border)', borderRadius: 8, color: '#94a3b8' }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="glass" style={{ padding: '1rem 3rem', color: 'var(--accent-primary)', fontWeight: 700, cursor: 'pointer' }}>
          Save All Changes
        </button>
      </div>
    </div>
  );
}

