import { useEffect, useMemo, useState } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap, LayersControl, ZoomControl,
} from 'react-leaflet';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import type { ProcessedEarthquake } from '../../types/earthquake';
import {
  getMagnitudeColor, getMarkerSize, formatTimeAgo, safeUsgsUrl,
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
    // Re-sync Leaflet's internal size after layout changes (rotation,
    // viewport resize, drawers opening) so tiles never render half-blank.
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
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: '#04070f' }}
    >
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={16}
        worldCopyJump
        attributionControl={false}
        zoomControl={false}
        tapTolerance={20}
        style={{ width: '100%', height: '100%' }}
        aria-label="Global earthquake map"
      >
        {/* Bottom-left keeps thumbs clear of the top-left event badge
            and the top-right layer switcher on narrow screens. */}
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

        {clustered.map((item) => {
          if ('members' in item) {
            const size = 30 + Math.min(item.members.length, 60) * 0.5;
            return (
              <CircleMarker
                key={item.key}
                center={[item.lat, item.lon]}
                radius={size / 2}
                pathOptions={{
                  fillColor: getMagnitudeColor(item.maxMag),
                  fillOpacity: 0.55,
                  color: '#fff',
                  weight: 1,
                  dashArray: '3 3',
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} className="ss-tip" opacity={1}>
                  <ClusterTip count={item.members.length} maxMag={item.maxMag} />
                </Tooltip>
              </CircleMarker>
            );
          }
          const eq = item;
          const color = getMagnitudeColor(eq.magnitude);
          const size = getMarkerSize(eq.magnitude);
          const isSel = selected?.id === eq.id;
          const fresh = isFresh(eq);
          return (
            <CircleMarker
              key={eq.id}
              center={[eq.latitude, eq.longitude]}
              radius={size / 2}
              pathOptions={{
                className: fresh && !isSel ? 'eq-fresh-halo' : undefined,
                fillColor: color,
                fillOpacity: isSel ? 0.95 : 0.78,
                color: isSel ? '#ffffff' : color,
                weight: isSel ? 2.5 : 1.2,
              }}
            >
              <Tooltip direction="top" offset={[0, -(size / 2)]} className="ss-tip" opacity={1}>
                <HoverTip eq={eq} color={color} />
              </Tooltip>
              <Popup maxWidth={300} minWidth={250}>
                <PopupBody eq={eq} color={color} onDetails={() => setSelected(eq)} />
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Loading veil — never blank */}
      {isLoading && earthquakes.length === 0 && (
        <div role="status" style={{ position: 'absolute', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,7,15,0.55)', color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
          Loading map data…
        </div>
      )}

      {/* Event count */}
      <div
        aria-live="polite"
        className="map-count"
        style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, background: 'rgba(10,18,34,0.88)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 11px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}
      >
        <strong className="ss-mono" style={{ color: 'var(--text-primary)' }}>{earthquakes.length}</strong> events plotted
        {zoom < 5 && earthquakes.length >= 120 && <span> · clustered</span>}
      </div>

      {/* Legend */}
      <div style={{ position: 'absolute', bottom: 14, right: 12, zIndex: 1000 }}>
        {legendOpen ? (
          <div className="ss-card" role="dialog" aria-label="Map legend" style={{ padding: '11px 13px', fontSize: '0.74rem', minWidth: 178 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 7 }}>
              <strong style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Magnitude</strong>
              <button onClick={() => setLegendOpen(false)} className="btn-icon" aria-label="Close legend" style={{ marginLeft: 'auto', padding: 3 }}>
                ✕
              </button>
            </div>
            {([
              ['< 2.0', '#22c55e', 'Micro / Minor'],
              ['2–4', '#eab308', 'Light'],
              ['4–5', '#f97316', 'Moderate'],
              ['5–6', '#ef4444', 'Strong'],
              ['6–7', '#dc2626', 'Major'],
              ['≥ 7', '#b91c1c', 'Great'],
            ] as [string, string, string][]).map(([range, c, label]) => (
              <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: c, border: '1px solid rgba(255,255,255,0.4)' }} />
                <span className="ss-mono" style={{ color: 'var(--text-primary)' }}>{range}</span>
                <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', paddingLeft: 10 }}>{label}</span>
              </div>
            ))}
            <div className="ss-meta" style={{ marginTop: 6 }}>Size = magnitude · ring = past hour</div>
          </div>
        ) : (
          <button onClick={() => setLegendOpen(true)} className="btn-ghost" aria-expanded={legendOpen} aria-label="Open map legend" style={{ background: 'rgba(10,18,34,0.9)', fontSize: '0.76rem' }}>
            Legend
          </button>
        )}
      </div>
    </div>
  );
}

function HoverTip({ eq, color }: { eq: ProcessedEarthquake; color: string }) {
  return (
    <div style={{ padding: '9px 11px', minWidth: 190 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <span className="ss-mono" aria-hidden="true" style={{ fontWeight: 600, fontSize: '0.92rem', color }}>M {eq.magnitude.toFixed(1)}</span>
        <span className={`mag-badge mag-${eq.category}`}>{eq.category}</span>
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.35, marginBottom: 3 }}>{eq.place}</div>
      <div className="ss-meta">Depth: {eq.depth.toFixed(0)} km · {formatTimeAgo(eq.time)}</div>
    </div>
  );
}

function ClusterTip({ count, maxMag }: { count: number; maxMag: number }) {
  return (
    <div style={{ padding: '9px 11px' }}>
      <div className="ss-mono" style={{ fontWeight: 600 }}>{count} events</div>
      <div className="ss-meta">Strongest M{maxMag.toFixed(1)} · zoom in to split</div>
    </div>
  );
}

function PopupBody({ eq, color, onDetails }: { eq: ProcessedEarthquake; color: string; onDetails: () => void }) {
  const usgsUrl = safeUsgsUrl(eq.url);
  return (
    <div style={{ padding: '13px 14px', minWidth: 240 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${color}d9, ${color}40)`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#fff' }}>
          {eq.magnitude.toFixed(1)}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.84rem', lineHeight: 1.3 }}>{eq.place}</div>
          <div className="ss-meta" style={{ textTransform: 'capitalize' }}>{eq.category} · {formatTimeAgo(eq.time)}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        {[
          ['Depth', `${eq.depth.toFixed(1)} km`],
          ['Coords', `${eq.latitude.toFixed(2)}, ${eq.longitude.toFixed(2)}`],
        ].map(([k, v]) => (
          <div key={k} style={{ background: 'rgba(148,163,184,0.07)', borderRadius: 7, padding: '5px 8px' }}>
            <div className="ss-meta" style={{ fontSize: '0.64rem' }}>{k}</div>
            <div className="ss-mono" style={{ fontSize: '0.76rem', fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>
      {eq.tsunami && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 700, color: '#7dd3fc', marginBottom: 8 }}>
          <Waves size={12} aria-hidden="true" /> TSUNAMI FLAG SET BY USGS
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onDetails} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.76rem', padding: '7px' }}>
          Full Details
        </button>
        <a href={usgsUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: '0.76rem', textDecoration: 'none', ...(usgsUrl ? {} : { opacity: 0.45, pointerEvents: 'none' }) }} aria-disabled={!usgsUrl}>
          <ExternalLink size={12} aria-hidden="true" /> USGS
        </a>
      </div>
    </div>
  );
}
