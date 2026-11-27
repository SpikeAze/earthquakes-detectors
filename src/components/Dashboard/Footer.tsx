import { Activity } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--fault-line)', marginTop: 32, padding: '24px 0 32px' }}>
      <div className="content" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: 'var(--p-wave)' }} aria-hidden="true" />
          <strong style={{ color: 'var(--quartz)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>SeismoScope</strong>
        </span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--mica)', lineHeight: 'var(--leading-relaxed)' }}>
          Real-time earthquake monitor · Data: <a href="https://earthquake.usgs.gov" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--p-wave)', textDecoration: 'none' }}>USGS Earthquake Hazards Program</a>
          {' · '}Basemap: Esri · For research and awareness — follow local authorities for safety guidance.
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', fontFamily: "'JetBrains Mono', monospace" }}>
          Updated from live USGS feed
        </span>
      </div>
    </footer>
  );
}
