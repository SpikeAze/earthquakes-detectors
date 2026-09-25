import { Database, RefreshCw, Gauge, Layers } from 'lucide-react';

export default function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="ss-card ss-card-pad">
      <h2 id="about-title" className="ss-h2" style={{ marginBottom: 4 }}>About &amp; data</h2>
      <p className="ss-sub" style={{ marginBottom: 14 }}>
        SeismoScope is a real-time observation dashboard for global earthquake activity. It visualizes authoritative event data — it does not predict earthquakes.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Database size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Data source</h3>
          </div>
          <p className="ss-meta" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.6 }}>
            Event catalog: USGS Earthquake Hazards Program (FDSN Event API, GeoJSON). Location search: OpenStreetMap Nominatim.
            Basemap: Esri World Dark Gray. Each event links to its authoritative USGS page.
          </p>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <RefreshCw size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Update cadence</h3>
          </div>
          <p className="ss-meta" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.6 }}>
            The dashboard fetches the USGS catalog on load and auto-refreshes every 5 minutes while Auto-refresh is ON.
            Use Refresh any time for an on-demand sync. The header always shows the last successful update time in UTC.
          </p>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Gauge size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Magnitude &amp; depth</h3>
          </div>
          <p className="ss-meta" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.6 }}>
            Magnitude is a logarithmic measure of energy release — each whole number is ~32× more energy.
            Depth: shallow (0–70 km), intermediate (70–300 km), deep (300–700 km). Marker size encodes magnitude; color adds severity.
          </p>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Layers size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Map markers</h3>
          </div>
          <p className="ss-meta" style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.6 }}>
            Circle diameter grows with magnitude and every marker shows its magnitude label.
            Hover (or tap) for magnitude, place, depth, and age. Select a marker or list row for full details, coordinates, and USGS verification.
          </p>
        </div>
      </div>
    </section>
  );
}
