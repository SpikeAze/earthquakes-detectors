import { useEffect } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import {
  formatDateTimeISO, formatLocalDateTime, formatTimeAgo,
  getDepthLabel, getMagnitudeColor, getMagnitudeCssVars,
  safeUsgsUrl,
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
  const cssVars = getMagnitudeCssVars(eq.magnitude);
  const usgsUrl = safeUsgsUrl(eq.url);

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
      <div className="overlay-backdrop" onClick={() => setSelected(null)} />
      <aside className="drawer" aria-label="Earthquake details">
        <div
          style={{
            padding: '18px 18px 14px', borderBottom: '1px solid var(--fault-line)',
            background: 'linear-gradient(180deg, var(--eq-color-1f), transparent)',
            ...cssVars,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span
              aria-hidden="true"
              className="mag-orb"
              style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: 'var(--eq-color)',
                borderColor: 'var(--eq-color)',
                fontSize: 'var(--text-xl)',
                ...cssVars,
              }}
            >
              {eq.magnitude.toFixed(1)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 'var(--tracking-wider)', color, textTransform: 'uppercase' }}>
                {eq.category} earthquake · {formatTimeAgo(eq.time)}
              </div>
              <h2 id="eq-details-title" style={{ margin: '4px 0 0', fontSize: 'var(--text-lg)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}>
                {eq.place}
              </h2>
            </div>
            <button onClick={() => setSelected(null)} className="btn btn-icon" aria-label="Close earthquake details" autoFocus>
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
              <div key={k} className="panel-instrument" style={{ padding: '10px 12px' }}>
                <dt style={{ marginBottom: 3, fontSize: 'var(--text-xs)', color: 'var(--mica)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>{k}</dt>
                <dd className="mono" style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--quartz)' }}>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="panel-instrument" style={{ padding: '12px 14px' }}>
            <div style={{ marginBottom: 6, fontSize: 'var(--text-xs)', color: 'var(--mica)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>Time</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>UTC</div><div className="mono" style={{ fontSize: 'var(--text-xs)' }}>{formatDateTimeISO(eq.time)}</div></div>
              <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>Local</div><div style={{ fontSize: 'var(--text-sm)' }}>{formatLocalDateTime(eq.time)}</div></div>
            </div>
          </div>

          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} aria-hidden="true" /> USGS event ID: <span className="mono">{eq.id}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={viewOnMap} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              <MapPin size={14} aria-hidden="true" /> View on Map
            </button>
            <button onClick={viewWaveform} className="btn btn-secondary">
              <Activity size={14} aria-hidden="true" /> Waveform
            </button>
            <button onClick={copyCoords} className="btn btn-secondary" aria-live="polite">
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy Coordinates'}
            </button>
          </div>

          {usgsUrl && (
            <a
              href={usgsUrl} target="_blank" rel="noopener noreferrer"
              className="btn btn-secondary" style={{ justifyContent: 'center', textDecoration: 'none' }}
            >
              <ExternalLink size={14} aria-hidden="true" /> Open authoritative USGS event page
            </a>
          )}
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--mica)', lineHeight: 'var(--leading-relaxed)' }}>
            Source: USGS Earthquake Hazards Program. Coordinates and magnitude are reviewed automatically and may be updated.
          </p>
        </div>
      </aside>
    </div>
  );
}
