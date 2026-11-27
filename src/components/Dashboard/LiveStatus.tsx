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

  const isLive = autoRefresh && !error && !isLoading;

  if (error) {
    return (
      <div
        role="alert"
        className="panel"
        style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 16px' }}
      >
        <AlertTriangle size={16} style={{ color: 'var(--mag-6)', flexShrink: 0 }} aria-hidden="true" />
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--mag-6)' }}>
          Unable to update earthquake data
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)' }}>Last successful update: <span className="mono">{utc(lastUpdated)}</span></span>
        <button onClick={fetchData} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
          <RefreshCw size={13} aria-hidden="true" /> Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="panel"
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}
      >
        <Loader2 size={16} style={{ color: 'var(--p-wave)', animation: 'spin 1s linear infinite' }} aria-hidden="true" />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--feldspar)' }}>
          Updating earthquake data…
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', marginLeft: 'auto' }}>Last updated: <span className="mono">{utc(lastUpdated)}</span></span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="panel"
      style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 16px' }}
    >
      <span className="live-indicator" style={{ marginRight: 8 }} />
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--quartz)' }}>
        {isLive ? 'Data updating' : 'Auto-refresh paused'}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)' }}>
        Last updated: <span className="mono">{utc(lastUpdated)}</span>
        {' · '}Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
      </span>
      <button
        onClick={fetchData}
        className="btn btn-secondary"
        style={{ marginLeft: 'auto' }}
        aria-label="Refresh earthquake data now"
      >
        <RefreshCw size={13} aria-hidden="true" /> Refresh now
      </button>
    </div>
  );
}
