import { useEffect } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import {
  formatDateTimeISO, formatLocalDateTime, formatTimeAgo,
  getDepthLabel, getMagnitudeColor,
} from '../../utils/helpers';
import { X, ExternalLink, MapPin, Copy, Check, Activity } from 'lucide-react';
import { useState } from 'react';

/** Side drawer (desktop) / bottom sheet (mobile) with strong info hierarchy. */
export default function EarthquakeDetails() {
  const eq = useEarthquakeStore((s) => s.selectedEarthquake);
  const setSelected = useEarthquakeStore((s) => s.setSelectedEarthquake);
  const focusOnMap = useEarthquakeStore((s) => s.focusOnMap);
  const addToast = useEarthquakeStore((s) => s.addToast);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSelected]);

  if (!eq) return null;
  const color = getMagnitudeColor(eq.magnitude);

  const copyCoords = async () => {
    const text = `${eq.latitude.toFixed(4)}, ${eq.longitude.toFixed(4)}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    addToast('Coordinates copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 1600);
  };

  const viewOnMap = () => {
    focusOnMap(eq.latitude, eq.longitude);
    setSelected(null);
    requestAnimationFrame(() => {
      document.getElementById('live-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const viewWaveform = () => {
    setSelected(null);
    requestAnimationFrame(() => {
      document.getElementById('seismic-activity')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="eq-details-title">
      <div className="ss-drawer-backdrop" onClick={() => setSelected(null)} />
      <aside className="ss-drawer" aria-label="Earthquake details">
        <div
          style={{
            padding: '18px 18px 14px', borderBottom: '1px solid var(--border)',
            background: `linear-gradient(180deg, ${color}1f, transparent)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span
              aria-hidden="true"
              style={{
                width: 62, height: 62, borderRadius: '50%', flexShrink: 0,
                background: `radial-gradient(circle at 35% 30%, ${color}d9, ${color}45)`,
                border: `2px solid ${color}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span className="ss-mono" style={{ fontWeight: 600, fontSize: '1.25rem', color: '#fff', lineHeight: 1 }}>
                {eq.magnitude.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.75)' }}>{eq.magnitudeType ?? 'M'}</span>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color, textTransform: 'uppercase' }}>
                {eq.category} earthquake · {formatTimeAgo(eq.time)}
              </div>
              <h2 id="eq-details-title" style={{ margin: '4px 0 0', fontSize: '1.02rem', fontWeight: 700, lineHeight: 1.35 }}>
                {eq.place}
              </h2>
            </div>
            <button onClick={() => setSelected(null)} className="btn-icon" aria-label="Close earthquake details" autoFocus>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['Magnitude', `M ${eq.magnitude.toFixed(1)}${eq.magnitudeType ? ` (${eq.magnitudeType})` : ''}`],
              ['Depth', `${eq.depth.toFixed(1)} km · ${getDepthLabel(eq.depth)}`],
              ['Latitude', `${eq.latitude.toFixed(4)}°`],
              ['Longitude', `${eq.longitude.toFixed(4)}°`],
              ['Date', new Date(eq.time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })],
              ['Status', eq.status],
              ...(eq.distanceKm !== undefined ? [['Distance', `${eq.distanceKm.toFixed(0)} km`]] as [string, string][] : []),
              ...(eq.felt ? [['Felt reports', String(eq.felt)]] as [string, string][] : []),
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 11px' }}>
                <dt className="ss-meta" style={{ marginBottom: 3 }}>{k}</dt>
                <dd className="ss-mono" style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600 }}>{v}</dd>
              </div>
            ))}
          </dl>

          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '11px 13px' }}>
            <div className="ss-section-label" style={{ marginBottom: 6 }}>Time</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div className="ss-meta">UTC</div><div className="ss-mono" style={{ fontSize: '0.76rem' }}>{formatDateTimeISO(eq.time)}</div></div>
              <div><div className="ss-meta">Local</div><div style={{ fontSize: '0.78rem' }}>{formatLocalDateTime(eq.time)}</div></div>
            </div>
          </div>

          <div className="ss-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} aria-hidden="true" /> USGS event ID: <span className="ss-mono">{eq.id}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={viewOnMap} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <MapPin size={14} aria-hidden="true" /> View on Map
            </button>
            <button onClick={viewWaveform} className="btn-ghost">
              <Activity size={14} aria-hidden="true" /> Waveform
            </button>
            <button onClick={copyCoords} className="btn-ghost" aria-live="polite">
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy Coordinates'}
            </button>
          </div>

          <a
            href={eq.url} target="_blank" rel="noopener noreferrer"
            className="btn-ghost" style={{ justifyContent: 'center', textDecoration: 'none' }}
          >
            <ExternalLink size={14} aria-hidden="true" /> Open authoritative USGS event page
          </a>
          <p className="ss-meta" style={{ margin: 0 }}>
            Source: USGS Earthquake Hazards Program. Coordinates and magnitude are reviewed automatically and may be updated.
          </p>
        </div>
      </aside>
    </div>
  );
}
