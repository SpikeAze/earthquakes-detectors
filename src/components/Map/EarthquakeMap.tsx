import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap, LayersControl, ZoomControl,
} from 'react-leaflet';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import type { ProcessedEarthquake } from '../../types/earthquake';
import {
  getMarkerSize, formatTimeAgo, safeUsgsUrl,
  getMagnitudeCssVars,
} from '../../utils/helpers';
import { Waves, ExternalLink } from 'lucide-react';

const FRESH_MS = 60 * 60 * 1000;
const isFresh = (eq: ProcessedEarthquake) => Date.now() - eq.time < FRESH_MS;

function FlyController() {
  const map = useMap();
  const location = useEarthquakeStore((s) => s.location);
  const mapFocus = useEarthquakeStore((s) => s.mapFocus);

  useEffect(() => {
    if (mapFocus) map.flyTo([mapFocus.latitude, mapFocus.longitude], 6, { duration: 1.2 });
  }, [mapFocus, map]);

  useEffect(() => {
    if (location.latitude !== null && location.longitude !== null && !mapFocus) {
      map.flyTo([location.latitude, location.longitude], 5, { duration: 1.2 });
    }
  }, [location.latitude, location.longitude, map, mapFocus]);

  return null;
}

function ResizeController() {
  const map = useMap();
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const fix = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => { map.invalidateSize(); }, 180);
    };
    fix();
    window.addEventListener('resize', fix);
    window.addEventListener('orientationchange', fix);
    return () => {
      window.removeEventListener('resize', fix);
      window.removeEventListener('orientationchange', fix);
      if (t) clearTimeout(t);
    };
  }, [map]);
  return null;
}

interface Cluster {
  key: string;
  lat: number;
  lon: number;
  members: ProcessedEarthquake[];
  maxMag: number;
}

/** Lightweight grid clustering for dense global views — no extra dependency. */
function useClusters(items: ProcessedEarthquake[], zoom: number): (Cluster | ProcessedEarthquake)[] {
  return useMemo(() => {
    if (items.length < 120 || zoom >= 5) return items;
    const cell = zoom <= 2 ? 6 : 3;
    const groups = new Map<string, ProcessedEarthquake[]>();
    for (const eq of items) {
      const k = `${Math.floor(eq.latitude / cell)}:${Math.floor(eq.longitude / cell)}`;
      const g = groups.get(k);
      if (g) g.push(eq);
      else groups.set(k, [eq]);
    }
    const out: (Cluster | ProcessedEarthquake)[] = [];
    for (const [key, members] of groups) {
      if (members.length < 3) { out.push(...members); continue; }
      const lat = members.reduce((s, e) => s + e.latitude, 0) / members.length;
      const lon = members.reduce((s, e) => s + e.longitude, 0) / members.length;
      out.push({ key, lat, lon, members, maxMag: Math.max(...members.map((m) => m.magnitude)) });
    }
    return out;
  }, [items, zoom]);
}

function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    onZoom(map.getZoom());
    const h = () => onZoom(map.getZoom());
    map.on('zoomend', h);
    return () => { map.off('zoomend', h); };
  }, [map, onZoom]);
  return null;
}

export default function EarthquakeMap() {
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);
  const setSelected = useEarthquakeStore((s) => s.setSelectedEarthquake);
  const selected = useEarthquakeStore((s) => s.selectedEarthquake);
  const isLoading = useEarthquakeStore((s) => s.isLoading);
  const [zoom, setZoom] = useState(2);
  const [legendOpen, setLegendOpen] = useState(false);
  const clustered = useClusters(earthquakes, zoom);

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, borderRadius: 'var(--radius-overlay)', overflow: 'hidden', border: '1px solid var(--fault-line)', background: 'var(--stratum-0)' }}
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={16}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        bounceAtZoomLimits={false}
        attributionControl={false}
        zoomControl={false}
        tapTolerance={20}
        style={{ width: '100%', height: '100%' }}
        aria-label="Global earthquake map"
      >
        <ZoomControl position="bottomleft" />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Imagery">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
          </LayersControl.BaseLayer>
          <LayersControl.Overlay name="Reference labels">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              maxZoom={16}
            />
          </LayersControl.Overlay>
        </LayersControl>

        <FlyController />
        <ResizeController />
        <ZoomTracker onZoom={setZoom} />

        <div style={{ 
          width: '100%', 
          height: 'auto', 
          maxHeight: '600px',
          aspectRatio: '16 / 9',
        }}>
        {clustered.map((item) => {
          if ('members' in item) {
            const size = 30 + Math.min(item.members.length, 60) * 0.5;
            const cssVars = getMagnitudeCssVars(item.maxMag);
            return (
              <CircleMarker
                key={item.key}
                center={[item.lat, item.lon]}
                radius={size / 2}
                pathOptions={{
                  fillColor: cssVars['--eq-color'],
                  fillOpacity: 0.55,
                  color: '#fff',
                  weight: 1,
                  dashArray: '3 3',
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} className="custom-tip" opacity={1}>
                  <ClusterTip count={item.members.length} maxMag={item.maxMag} />
                </Tooltip>
              </CircleMarker>
            );
          }
          const eq = item;
          const size = getMarkerSize(eq.magnitude);
          const isSel = selected?.id === eq.id;
          const fresh = isFresh(eq);
          const cssVars = getMagnitudeCssVars(eq.magnitude);
          return (
            <CircleMarker
              key={eq.id}
              center={[eq.latitude, eq.longitude]}
              radius={size / 2}
              pathOptions={{
                className: fresh && !isSel ? 'eq-fresh-halo' : undefined,
                fillColor: isSel ? '#ffffff' : cssVars['--eq-color'],
                fillOpacity: isSel ? 0.95 : 0.78,
                color: isSel ? '#ffffff' : cssVars['--eq-color'],
                weight: isSel ? 2.5 : 1.2,
              }}
            >
              <Tooltip direction="top" offset={[0, -(size / 2)]} className="custom-tip" opacity={1}>
                <HoverTip eq={eq} cssVars={cssVars} />
              </Tooltip>
              <Popup maxWidth={300} minWidth={250}>
                <PopupBody eq={eq} cssVars={cssVars} onDetails={() => setSelected(eq)} />
              </Popup>
            </CircleMarker>
          );
        })}
        </div>
      </MapContainer>

      {/* Loading veil — never blank */}
      {isLoading && earthquakes.length === 0 && (
        <div role="status" style={{ position: 'absolute', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,7,9,0.6)', color: 'var(--mica)', fontSize: 'var(--text-sm)' }}>
          Loading map data…
        </div>
      )}

      {/* Event count */}
      <div
        aria-live="polite"
        style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: 'rgba(10,13,14,0.9)', border: '1px solid var(--fault-line-strong)', borderRadius: 'var(--radius-instrument)', padding: '6px 11px', fontSize: 'var(--text-xs)', color: 'var(--feldspar)', backdropFilter: 'blur(8px)' }}
      >
        <strong className="mono" style={{ color: 'var(--quartz)' }}>{earthquakes.length}</strong> events plotted
        {zoom < 5 && earthquakes.length >= 120 && <span style={{ color: 'var(--mica)' }}> · clustered</span>}
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 14, right: 12, zIndex: 1000 }}>
        {legendOpen ? (
          <div className="panel" role="dialog" aria-label="Map legend" style={{ padding: '12px 14px', fontSize: 'var(--text-xs)', minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', color: 'var(--mica)' }}>Magnitude</strong>
              <button onClick={() => setLegendOpen(false)} className="btn btn-icon" aria-label="Close legend" style={{ marginLeft: 'auto', padding: 3 }}>
                <span style={{ fontSize: '12px', lineHeight: 1 }}>✕</span>
              </button>
            </div>
            {([
              ['< 1.0', 'mag-0', 'Micro'],
              ['1.0–2.0', 'mag-1', 'Minor'],
              ['2.0–3.0', 'mag-2', 'Light'],
              ['3.0–4.0', 'mag-3', 'Moderate'],
              ['4.0–5.0', 'mag-4', 'Strong'],
              ['5.0–6.0', 'mag-5', 'Major'],
              ['6.0–7.0', 'mag-6', 'Great'],
              ['≥ 7.0', 'mag-7', 'Mega'],
            ] as [string, string, string][]).map(([range, cls, label]) => (
              <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <span className={`mag-badge ${cls}`} style={{ padding: '1px 6px', fontSize: 'var(--text-xs)' }}>{range}</span>
                <span style={{ color: 'var(--mica)', fontSize: 'var(--text-xs)', marginLeft: 'auto' }}>{label}</span>
              </div>
            ))}
            <div style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--mica)' }}>Size = magnitude · ring = past hour</div>
          </div>
        ) : (
          <button onClick={() => setLegendOpen(true)} className="btn btn-secondary" aria-expanded={legendOpen} aria-label="Open map legend" style={{ fontSize: 'var(--text-xs)' }}>
            Legend
          </button>
        )}
      </div>
    </div>
  );
}

function HoverTip({ eq, cssVars }: { eq: ProcessedEarthquake; cssVars: React.CSSProperties }) {
  return (
    <div style={{ padding: '10px 12px', minWidth: 190, ...cssVars }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <span className="mono" aria-hidden="true" style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--eq-color)' }}>M {eq.magnitude.toFixed(1)}</span>
        <span className={`mag-badge mag-${eq.category}`}>{eq.category}</span>
      </div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, lineHeight: 1.35, marginBottom: 3, color: 'var(--quartz)' }}>{eq.place}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)' }}>Depth: {eq.depth.toFixed(0)} km · {formatTimeAgo(eq.time)}</div>
    </div>
  );
}

function ClusterTip({ count, maxMag }: { count: number; maxMag: number }) {
  const cssVars = getMagnitudeCssVars(maxMag);
  return (
    <div style={{ padding: '10px 12px', ...cssVars }}>
      <div className="mono" style={{ fontWeight: 600 }}>{count} events</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)' }}>Strongest M{maxMag.toFixed(1)} · zoom in to split</div>
    </div>
  );
}

function PopupBody({ eq, cssVars, onDetails }: { eq: ProcessedEarthquake; cssVars: Record<string, string>; onDetails: () => void }) {
  const usgsUrl = safeUsgsUrl(eq.url);
  return (
    <div style={{ padding: '14px 16px', minWidth: 250, ...cssVars }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span aria-hidden="true" style={{ width: 48, height: 48, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${cssVars['--eq-color-dd']}, ${cssVars['--eq-color-40']})`, border: `2px solid ${cssVars['--eq-color']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#fff' }}>
          {eq.magnitude.toFixed(1)}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', lineHeight: 1.3, color: 'var(--quartz)' }}>{eq.place}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', textTransform: 'capitalize' }}>{eq.category} · {formatTimeAgo(eq.time)}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        {[
          ['Depth', `${eq.depth.toFixed(1)} km`],
          ['Coords', `${eq.latitude.toFixed(2)}, ${eq.longitude.toFixed(2)}`],
        ].map(([k, v]) => (
          <div key={k} className="panel-instrument" style={{ padding: '6px 8px' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>{k}</div>
            <div className="mono" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>
      {eq.tsunami && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--p-wave)', marginBottom: 10 }}>
          <Waves size={12} aria-hidden="true" /> TSUNAMI FLAG SET BY USGS
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onDetails} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 'var(--text-sm)', padding: '8px' }}>
          Full Details
        </button>
        <a href={usgsUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: 'var(--text-sm)', textDecoration: 'none', ...(usgsUrl ? {} : { opacity: 0.45, pointerEvents: 'none' }) }} aria-disabled={!usgsUrl}>
          <ExternalLink size={12} aria-hidden="true" /> USGS
        </a>
      </div>
    </div>
  );
}
