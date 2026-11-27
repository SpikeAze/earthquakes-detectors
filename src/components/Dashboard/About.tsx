import { Database, RefreshCw, Gauge, Layers, Shield } from 'lucide-react';

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="panel" style={{ padding: '20px' }}>
      <h2 id="about-title" style={{ marginBottom: 10, fontSize: 'var(--text-lg)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)' }}>About & data</h2>
      <p style={{ marginBottom: 20, fontSize: 'var(--text-sm)', color: 'var(--feldspar)', lineHeight: 'var(--leading-relaxed)' }}>
        SeismoScope is a real-time observation dashboard for global earthquake activity. It visualizes authoritative event data — it does not predict earthquakes.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div className="panel-instrument" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ display: 'flex', color: 'var(--p-wave)' }} aria-hidden="true"><Database size={16} /></span>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--quartz)' }}>Data source</h3>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--mica)', lineHeight: 'var(--leading-relaxed)' }}>
            Event catalog: USGS Earthquake Hazards Program (FDSN Event API, GeoJSON). Location search: OpenStreetMap Nominatim.
            Basemap: Esri World Dark Gray. Each event links to its authoritative USGS page.
          </p>
        </div>
        <div className="panel-instrument" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ display: 'flex', color: 'var(--s-wave)' }} aria-hidden="true"><RefreshCw size={16} /></span>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--quartz)' }}>Update cadence</h3>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--mica)', lineHeight: 'var(--leading-relaxed)' }}>
            The dashboard fetches the USGS catalog on load and auto-refreshes every 5 minutes while Auto-refresh is ON.
            Use Refresh any time for on-demand sync. The header shows the last successful update in UTC.
          </p>
        </div>
        <div className="panel-instrument" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ display: 'flex', color: 'var(--surface-wave)' }} aria-hidden="true"><Gauge size={16} /></span>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--quartz)' }}>Magnitude & depth</h3>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--mica)', lineHeight: 'var(--leading-relaxed)' }}>
            Magnitude is a logarithmic measure of energy release — each whole number is ~32× more energy.
            Depth: shallow (0–70 km), intermediate (70–300 km), deep (300–700 km). Marker size encodes magnitude; color reflects energy.
          </p>
        </div>
        <div className="panel-instrument" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ display: 'flex', color: 'var(--surface-wave)' }} aria-hidden="true"><Layers size={16} /></span>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--quartz)' }}>Map markers</h3>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--mica)', lineHeight: 'var(--leading-relaxed)' }}>
            Circle diameter grows with magnitude; every marker shows its magnitude label.
            Hover/tap for magnitude, place, depth, and age. Select for full details, coordinates, and USGS verification.
          </p>
        </div>
      </div>
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--fault-line)' }}>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--mica)', lineHeight: 'var(--leading-relaxed)' }}>
          <Shield size={12} style={{ display: 'inline-flex', verticalAlign: 'text-bottom', marginRight: 6, color: 'var(--p-wave)' }} aria-hidden="true" />
          <strong style={{ color: 'var(--feldspar)' }}>Privacy:</strong> SeismoScope stores nothing — no accounts, cookies, or tracking. The only data that leaves your browser is
          the earthquake catalog request (USGS), map tiles (Esri), fonts (Google Fonts), and any location search you type,
          which is sent to OpenStreetMap Nominatim solely to resolve coordinates.
        </p>
      </div>
    </section>
  );
}
