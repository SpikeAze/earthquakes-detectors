import { useMemo } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import EarthquakeCard from './EarthquakeCard';
import { Activity, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

export default function EarthquakeFeed() {
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);
  const isLoading   = useEarthquakeStore((s) => s.isLoading);
  const error       = useEarthquakeStore((s) => s.error);
  const fetchData   = useEarthquakeStore((s) => s.fetchData);
  const lastUpdated = useEarthquakeStore((s) => s.lastUpdated);

  const sorted = useMemo(() => [...earthquakes], [earthquakes]);

  const maxMag = sorted.length ? Math.max(...sorted.map((e) => e.magnitude)) : 0;
  const avgMag = sorted.length
    ? sorted.reduce((s, e) => s + e.magnitude, 0) / sorted.length
    : 0;

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-glass)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border-glass)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Live Feed
            </span>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="btn-icon"
            title="Refresh"
            style={{ padding: 6 }}
          >
            {isLoading
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <RefreshCw size={14} />
            }
          </button>
        </div>

        {/* Mini stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            ['Events', sorted.length.toString()],
            ['Max Mag', maxMag.toFixed(1)],
            ['Avg Mag', avgMag.toFixed(1)],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: 7,
                padding: '5px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                {val}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {lastUpdated && (
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: '10px 12px', padding: '8px 12px', borderRadius: 8,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>{error}</span>
        </div>
      )}

      {/* List */}
      <div className="feed-scroll" style={{ flex: 1, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {isLoading && sorted.length === 0
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
            ))
          : sorted.length === 0
          ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: 60, fontSize: '0.85rem' }}>
              No earthquakes match your filters.
            </div>
          )
          : sorted.map((eq, i) => (
              <div key={eq.id} className="fade-in-up" style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}>
                <EarthquakeCard earthquake={eq} rank={i + 1} />
              </div>
            ))
        }
      </div>
    </div>
  );
}
