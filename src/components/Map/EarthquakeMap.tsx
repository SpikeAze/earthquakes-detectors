import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import {
  getMagnitudeColor,
  getMagnitudeGlow,
  getMarkerSize,
  formatTimeAgo,
  formatLocalDateTime,
} from '../../utils/helpers';
import { Waves, ExternalLink, Clock } from 'lucide-react';

// ─── Fly-to helper ────────────────────────────────────────────────────────────
function MapController() {
  const map = useMap();
  const location = useEarthquakeStore((s) => s.location);

  useEffect(() => {
    if (location.latitude !== null && location.longitude !== null) {
      map.flyTo([location.latitude, location.longitude], 6, { duration: 1.5 });
    }
  }, [location.latitude, location.longitude, map]);

  return null;
}

function MapResizer() {
  const map = useMap();
  const feedOpen = useEarthquakeStore((s) => s.feedOpen);
  const filterPanelOpen = useEarthquakeStore((s) => s.filterPanelOpen);

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timeout);
  }, [map, feedOpen, filterPanelOpen]);

  return null;
}

// ─── Main Map Component ───────────────────────────────────────────────────────
export default function EarthquakeMap() {
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);
  const setSelectedEarthquake = useEarthquakeStore((s) => s.setSelectedEarthquake);
  const selectedEarthquake = useEarthquakeStore((s) => s.selectedEarthquake);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[var(--border-glass)]">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        worldCopyJump={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri &mdash; Esri, DeLorme, NAVTEQ | Data: <a href="https://earthquake.usgs.gov">USGS</a>'
          maxZoom={16}
        />

        <MapController />
        <MapResizer />

        {earthquakes.map((eq) => {
          const color = getMagnitudeColor(eq.magnitude);
          const glow = getMagnitudeGlow(eq.magnitude);
          const size = getMarkerSize(eq.magnitude);
          const isSelected = selectedEarthquake?.id === eq.id;

          return (
            <CircleMarker
              key={eq.id}
              center={[eq.latitude, eq.longitude]}
              radius={size / 2}
              pathOptions={{
                className: isSelected ? 'eq-marker-pulse-selected' : 'eq-marker-pulse',
                fillColor: color,
                fillOpacity: isSelected ? 0.95 : 0.75,
                color: isSelected ? '#fff' : color,
                weight: isSelected ? 2 : 1,
              }}
              eventHandlers={{
                mouseover: (e) => { e.target.setStyle({ fillOpacity: 1 }); },
                mouseout: (e) => { e.target.setStyle({ fillOpacity: isSelected ? 0.95 : 0.75 }); },
              }}
            >
              <Popup maxWidth={300}>
                <div style={{ padding: '12px 14px', minWidth: '240px' }}>
                  {/* Magnitude header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44)`,
                        border: `2px solid ${color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: glow !== 'transparent' ? `0 0 16px ${glow}` : 'none',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700, fontSize: '1rem', color: 'white',
                      }}
                    >
                      {eq.magnitude.toFixed(1)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {eq.place}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
                        {eq.category} earthquake
                      </div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                    {([
                      ['Depth', `${eq.depth.toFixed(1)} km`],
                      ['Depth (mi)', `${eq.depthMiles.toFixed(1)} mi`],
                      ['Lat', eq.latitude.toFixed(3)],
                      ['Lon', eq.longitude.toFixed(3)],
                      ...(eq.felt ? [['Felt', `${eq.felt} reports`]] : []),
                      ...(eq.distanceKm ? [['Distance', `${eq.distanceKm.toFixed(0)} km`]] : []),
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 8px' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 1 }}>{label}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {eq.tsunami && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: '#60a5fa', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 4, padding: '2px 6px' }}>
                        <Waves size={10} /> Tsunami Warning
                      </span>
                    )}
                    {eq.alert && (
                      <span style={{ fontSize: '0.7rem', color: eq.alert === 'red' ? '#f87171' : eq.alert === 'orange' ? '#fb923c' : '#fbbf24', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, padding: '2px 6px', textTransform: 'capitalize' }}>
                        {eq.alert} Alert
                      </span>
                    )}
                  </div>

                  {/* Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    <Clock size={11} />
                    {formatLocalDateTime(eq.time)} · {formatTimeAgo(eq.time)}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setSelectedEarthquake(eq)}
                      style={{ flex: 1, padding: '6px', borderRadius: 6, border: '1px solid var(--border-glass)', background: 'rgba(79,142,247,0.1)', color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Full Details
                    </button>
                    <a
                      href={eq.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'none' }}
                    >
                      <ExternalLink size={12} /> USGS
                    </a>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Map legend */}
      <div
        className="glass-card"
        style={{ position: 'absolute', bottom: 32, right: 12, zIndex: 1000, padding: '10px 14px', fontSize: '0.72rem' }}
      >
        <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>Magnitude</div>
        {([
          ['< 2.0', '#22c55e', 'Micro/Minor'],
          ['2.0–4.0', '#eab308', 'Light'],
          ['4.0–5.0', '#f97316', 'Moderate'],
          ['5.0–6.0', '#ef4444', 'Strong'],
          ['6.0–7.0', '#dc2626', 'Major'],
          ['≥ 7.0', '#991b1b', 'Great'],
        ] as [string, string, string][]).map(([range, color, label]) => (
          <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-muted)' }}>{range}</span>
            <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto', paddingLeft: 8 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
