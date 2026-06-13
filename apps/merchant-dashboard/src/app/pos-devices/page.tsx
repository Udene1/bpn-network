export default function POSDevicesPage() {
  const devices = [
    { id: 'POS-001', name: 'Main Gate Terminal', status: 'Online', lastActive: '2m ago' },
    { id: 'POS-002', name: 'Backyard Stand', status: 'Offline', lastActive: '4h ago' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>POS Devices</h1>
        <p style={{ color: '#94a3b8' }}>Manage and monitor your fingerprint scanning hardware.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {devices.map(dev => (
          <div key={dev.id} className="glass stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600 }}>{dev.name}</span>
              <span className={`pill pill-${dev.status === 'Online' ? 'success' : 'pending'}`}>{dev.status}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>ID: {dev.id}</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.5rem' }}>Last Signal: {dev.lastActive}</div>
          </div>
        ))}
        <div className="glass" style={{ borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '2rem' }}>
           <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>+ Add New Device</span>
        </div>
      </div>
    </div>
  );
}
