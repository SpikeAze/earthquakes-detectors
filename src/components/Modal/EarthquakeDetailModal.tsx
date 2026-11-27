import { useEarthquakeStore } from '../../store/earthquakeStore';
import {
  formatDateTimeISO,
  formatLocalDateTime,
  formatTimeAgo,
  getDepthLabel,
  getMagnitudeColor,
  getMagnitudeCssVars,
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
  const cssVars = getMagnitudeCssVars(eq.magnitude);
  const usgsUrl = safeUsgsUrl(eq.url);

  return (
    <div
      className="overlay-backdrop"
      onClick={() => setSelected(null)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(6, 8, 9, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          maxHeight: '90vh', overflowY: 'auto',
          borderRadius: 'var(--radius-overlay)',
          background: 'var(--stratum-2)',
          border: '1px solid var(--eq-color-44)',
          boxShadow: '0 24px 60px rgba(6,8,9,0.8), 0 0 40px var(--eq-color-22)',
          ...cssVars,
        }}
      >
        {/* Header band */}
        <div style={{
          background: 'linear-gradient(135deg, var(--eq-color-22), transparent)',
          borderBottom: '1px solid var(--eq-color-33)',
          padding: '20px 20px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 14,
          ...cssVars,
        }}>
          {/* Magnitude orb */}
          <div style={{
            width: 70, height: 70, borderRadius: '50%', flexShrink: 0,
            background: 'radial-gradient(circle at 35% 30%, var(--eq-color-dd), var(--eq-color-55))',
            border: '2px solid var(--eq-color)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px var(--eq-color-55)',
            ...cssVars,
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '1.4rem', color: 'white', lineHeight: 1 }}>
              {eq.magnitude.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {eq.magnitudeType ?? 'M'}
            </span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', color, marginBottom: 3 }}>
              {eq.category} earthquake
            </div>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--quartz)', lineHeight: 1.3, marginBottom: 6 }}>
              {eq.place}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {eq.tsunami && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--p-wave)', background: 'var(--p-wave-dim)', border: '1px solid var(--p-wave)', borderRadius: 'var(--radius-instrument)', padding: '2px 8px' }}>
                  <Waves size={11} /> TSUNAMI WARNING
                </span>
              )}
              {eq.alert && (
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, 
                  color: eq.alert === 'red' ? 'var(--mag-6)' : eq.alert === 'orange' ? 'var(--mag-4)' : 'var(--mag-3)', 
                  background: eq.alert === 'red' ? 'rgba(192, 57, 43, 0.15)' : eq.alert === 'orange' ? 'rgba(232, 141, 42, 0.15)' : 'rgba(240, 200, 8, 0.15)', 
                  border: eq.alert === 'red' ? '1px solid rgba(192, 57, 43, 0.4)' : eq.alert === 'orange' ? '1px solid rgba(232, 141, 42, 0.4)' : '1px solid rgba(240, 200, 8, 0.4)', 
                  borderRadius: 'var(--radius-instrument)', padding: '2px 8px', textTransform: 'uppercase' }}>
                  {eq.alert} Alert
                </span>
              )}
            </div>
          </div>

          <button onClick={() => setSelected(null)} className="btn btn-icon" style={{ flexShrink: 0, padding: 6 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Grid metrics */}
          <div className="modal-metrics-grid" style={{ display:'grid', gap: 8 }}>
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
              <div key={label} className="panel-instrument" style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--mica)', fontSize: 'var(--text-xs)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>
                  {icon} {label}
                </div>
                <div className="mono" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--quartz)' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Time block */}
          <div className="panel-instrument" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Clock size={14} style={{ color: 'var(--p-wave)' }} />
              <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--quartz)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>Time Information</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {([
                ['Local Time',    formatLocalDateTime(eq.time)],
                ['UTC (ISO-8601)', formatDateTimeISO(eq.time)],
                ['Time Ago',      formatTimeAgo(eq.time)],
                ['Last Updated',  formatLocalDateTime(eq.updated)],
              ] as [string, string][]).map(([lbl, val]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>{lbl}</div>
                  <div className="mono" style={{ fontSize: 'var(--text-xs)', color: lbl === 'Time Ago' ? 'var(--p-wave)' : 'var(--quartz)', fontWeight: lbl === 'Time Ago' ? 600 : 400, fontFamily: lbl === 'UTC (ISO-8601)' ? "'JetBrains Mono', monospace" : 'inherit' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Event ID */}
          <div className="panel-instrument" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Hash size={14} style={{ color: 'var(--mica)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>USGS Event ID</div>
              <div className="mono" style={{ fontSize: 'var(--text-sm)', color: 'var(--quartz)' }}>{eq.id}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {usgsUrl && (
              <a
                href={usgsUrl} target="_blank" rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', fontSize: 'var(--text-sm)' }}
              >
                <ExternalLink size={14} /> View on USGS
              </a>
            )}
            <button
              onClick={() => exportToCSV([eq])}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-sm)', padding: '8px 14px' }}
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
