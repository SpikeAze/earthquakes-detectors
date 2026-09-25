import { useEarthquakeStore } from '../../store/earthquakeStore';
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

function utc(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toISOString().slice(11, 19) + ' UTC';
}

/** Compact status strip used under the dashboard title. */
export default function LiveStatus() {
  const isLoading = useEarthquakeStore((s) => s.isLoading);
  const error = useEarthquakeStore((s) => s.error);
  const lastUpdated = useEarthquakeStore((s) => s.lastUpdated);
  const autoRefresh = useEarthquakeStore((s) => s.autoRefresh);
  const fetchData = useEarthquakeStore((s) => s.fetchData);

  if (error) {
    return (
      <div
        role="alert"
        style={{
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)',
          borderRadius: 12, padding: '10px 14px',
        }}
      >
        <AlertTriangle size={15} style={{ color: '#f87171', flexShrink: 0 }} aria-hidden="true" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fca5a5' }}>
          Unable to update earthquake data
        </span>
        <span className="ss-meta">Last successful update: {utc(lastUpdated)}</span>
        <button onClick={fetchData} className="btn-ghost" style={{ marginLeft: 'auto', fontSize: '0.78rem' }}>
          <RefreshCw size={13} aria-hidden="true" /> Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid var(--border)', background: 'var(--bg-card)',
          borderRadius: 12, padding: '10px 14px',
        }}
      >
        <Loader2 size={15} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} aria-hidden="true" />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Updating earthquake data…
        </span>
        <span className="ss-meta" style={{ marginLeft: 'auto' }}>Last updated: {utc(lastUpdated)}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        border: '1px solid var(--border)', background: 'var(--bg-card)',
        borderRadius: 12, padding: '10px 14px',
      }}
    >
      <span className={autoRefresh ? 'live-dot live' : 'live-dot paused'} aria-hidden="true" />
      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
        {autoRefresh ? 'Data updating' : 'Auto-refresh paused'}
      </span>
      <span className="ss-meta">
        Last updated: <span className="ss-mono">{utc(lastUpdated)}</span>
        {' · '}Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
      </span>
      <button
        onClick={fetchData}
        className="btn-ghost"
        style={{ marginLeft: 'auto', fontSize: '0.78rem' }}
        aria-label="Refresh earthquake data now"
      >
        <RefreshCw size={13} aria-hidden="true" /> Refresh now
      </button>
    </div>
  );
}
