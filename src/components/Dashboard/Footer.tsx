import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)', marginTop: 24,
        padding: '20px 0 28px', color: 'var(--text-muted)',
      }}
    >
      <div className="ss-main" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.84rem' }}>SeismoScope</strong>
        </span>
        <span style={{ fontSize: '0.76rem' }}>
          Real-time earthquake monitor · Data: <a href="https://earthquake.usgs.gov" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>USGS Earthquake Hazards Program</a>
          {' · '}Basemap: Esri · For research and awareness — follow local authorities for safety guidance.
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem' }} className="ss-mono">
          Updated from live USGS feed
        </span>
      </div>
    </footer>
  );
}
