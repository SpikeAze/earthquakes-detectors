import { useEarthquakeStore } from '../../store/earthquakeStore';
import {
  formatDateTimeISO,
  formatLocalDateTime,
  formatTimeAgo,
  getDepthLabel,
  getMagnitudeColor,
  safeUsgsUrl,
  exportToCSV,
} from '../../utils/helpers';
import {
  X, ExternalLink, MapPin, Clock, ArrowDown, Waves,
  Download, Activity, Globe, Hash,
} from 'lucide-react';

export default function EarthquakeDetailModal() {
  const eq          = useEarthquakeStore((s) => s.selectedEarthquake);
  const setSelected = useEarthquakeStore((s) => s.setSelectedEarthquake);

  if (!eq) return null;

  const color = getMagnitudeColor(eq.magnitude);
  const usgsUrl = safeUsgsUrl(eq.url);

  return (
    <div
      className="modal-backdrop"
      onClick={() => setSelected(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="modal-panel glass-card-solid"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
          borderRadius: 16,
          border: `1px solid ${color}44`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 40px ${color}22`,
        }}
      >
        {/* Header band */}
        <div style={{
          background: `linear-gradient(135deg, ${color}22, transparent)`,
          borderBottom: `1px solid ${color}33`,
          padding: '20px 20px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          {/* Magnitude orb */}
          <div style={{
            width: 70, height: 70, borderRadius: '50%', flexShrink: 0,
            background: `radial-gradient(circle at 35% 30%, ${color}dd, ${color}55)`,
            border: `2px solid ${color}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 30px ${color}55`,
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '1.4rem', color: 'white', lineHeight: 1 }}>
              {eq.magnitude.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {eq.magnitudeType ?? 'M'}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
              {eq.category} Earthquake
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 6 }}>
              {eq.place}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {eq.tsunami && (
                <span className="tsunami-badge" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#60a5fa', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: 5, padding: '2px 8px', fontWeight: 600 }}>
                  <Waves size={11} /> TSUNAMI WARNING
                </span>
              )}
              {eq.alert && (
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: eq.alert === 'red' ? '#f87171' : eq.alert === 'orange' ? '#fb923c' : '#fbbf24', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 5, padding: '2px 8px', textTransform: 'uppercase' }}>
                  {eq.alert} Alert
                </span>
              )}
            </div>
          </div>

          <button onClick={() => setSelected(null)} className="btn-icon" style={{ flexShrink: 0, padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Grid metrics */}
          <div className="modal-metrics-grid" style={{ display:'grid' }}>
            {([
              { label: 'Latitude',   value: `${eq.latitude.toFixed(4)}°`,    icon: <Globe size={13} /> },
              { label: 'Longitude',  value: `${eq.longitude.toFixed(4)}°`,   icon: <Globe size={13} /> },
              { label: 'Depth',      value: `${eq.depth.toFixed(1)} km`,     icon: <ArrowDown size={13} /> },
              { label: 'Depth (mi)', value: `${eq.depthMiles.toFixed(1)} mi`, icon: <ArrowDown size={13} /> },
              { label: 'Depth Type', value: getDepthLabel(eq.depth),          icon: <Activity size={13} /> },
              { label: 'Status',     value: eq.status,                        icon: <Activity size={13} /> },
              ...(eq.felt ? [{ label: 'Felt Reports',    value: eq.felt.toString(),     icon: <Activity size={13} /> }] : []),
              ...(eq.cdi  ? [{ label: 'Intensity (CDI)', value: eq.cdi.toFixed(1),      icon: <Activity size={13} /> }] : []),
              ...(eq.distanceKm ? [{ label: 'Distance',  value: `${eq.distanceKm.toFixed(0)} km`, icon: <MapPin size={13} /> }] : []),
            ] as { label: string; value: string; icon: React.ReactNode }[]).map(({ label, value, icon }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: 3 }}>
                  {icon} {label}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Time block */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Clock size={14} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Time Information</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([
                ['Local Time',    formatLocalDateTime(eq.time)],
                ['UTC (ISO-8601)', formatDateTimeISO(eq.time)],
                ['Time Ago',      formatTimeAgo(eq.time)],
                ['Last Updated',  formatLocalDateTime(eq.updated)],
              ] as [string, string][]).map(([lbl, val]) => (
                <div key={lbl}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{lbl}</div>
                  <div style={{ fontSize: '0.72rem', color: lbl === 'Time Ago' ? 'var(--accent-cyan)' : 'var(--text-primary)', fontWeight: lbl === 'Time Ago' ? 600 : 400, fontFamily: lbl === 'UTC (ISO-8601)' ? "'JetBrains Mono', monospace" : 'inherit' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Event ID */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Hash size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>USGS Event ID</div>
              <div style={{ fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>{eq.id}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {usgsUrl && (
              <a
                href={usgsUrl} target="_blank" rel="noopener noreferrer"
                className="btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', fontSize: '0.82rem' }}
              >
                <ExternalLink size={14} /> View on USGS
              </a>
            )}
            <button
              onClick={() => exportToCSV([eq])}
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
