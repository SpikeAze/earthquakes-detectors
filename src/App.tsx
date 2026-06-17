import { useEffect, Suspense, lazy } from 'react';
import { useEarthquakeStore } from './store/earthquakeStore';
import Navbar from './components/Layout/Navbar';
import ToastContainer from './components/Layout/ToastContainer';
import EarthquakeFeed from './components/Feed/EarthquakeFeed';
import FilterPanel from './components/Filters/FilterPanel';
import EarthquakeDetailModal from './components/Modal/EarthquakeDetailModal';
import TrendChart from './components/Charts/TrendChart';
import { getMagnitudeColor } from './utils/helpers';

// Lazy-load map to avoid SSR issues with Leaflet
const EarthquakeMap = lazy(() => import('./components/Map/EarthquakeMap'));

// ─── List View (full sortable table) ──────────────────────────────────────────
function ListView() {
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);
  const setSelected = useEarthquakeStore((s) => s.setSelectedEarthquake);

  return (
    <div style={{ overflowX: 'auto', padding: '12px 16px', height: '100%', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {['#', 'Mag', 'Category', 'Location', 'Depth (km)', 'Depth (mi)', 'Lat', 'Lon', 'Time', 'Felt', 'Actions'].map((h) => (
              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid var(--border-glass)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {earthquakes.map((eq, i) => {
            const color = getMagnitudeColor(eq.magnitude);
            return (
              <tr
                key={eq.id}
                onClick={() => setSelected(eq)}
                style={{
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(79,142,247,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              >
                <td style={{ padding: '8px 10px', color: 'var(--text-muted)', borderRadius: '6px 0 0 6px' }}>{i + 1}</td>
                <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color }}>
                  {eq.magnitude.toFixed(1)}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <span className={`mag-badge mag-${eq.category}`}>{eq.category}</span>
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--text-primary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {eq.place}
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{eq.depth.toFixed(1)}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>{eq.depthMiles.toFixed(1)}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{eq.latitude.toFixed(3)}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{eq.longitude.toFixed(3)}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(eq.time).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{eq.felt ?? '—'}</td>
                <td style={{ padding: '8px 10px', borderRadius: '0 6px 6px 0' }}>
                  <a href={eq.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                    USGS ↗
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const fetchData       = useEarthquakeStore((s) => s.fetchData);
  const viewMode        = useEarthquakeStore((s) => s.viewMode);
  const filterPanelOpen = useEarthquakeStore((s) => s.filterPanelOpen);
  const selectedEq      = useEarthquakeStore((s) => s.selectedEarthquake);

  // Initial fetch + auto-refresh every 5 minutes
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Filter Sidebar */}
        <div
          style={{
            width: filterPanelOpen ? 280 : 0,
            overflow: 'hidden',
            transition: 'width 0.25s ease',
            borderRight: filterPanelOpen ? '1px solid var(--border-glass)' : 'none',
            background: 'var(--bg-secondary)',
            flexShrink: 0,
          }}
        >
          {filterPanelOpen && <FilterPanel />}
        </div>

        {/* Feed sidebar */}
        <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <EarthquakeFeed />
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {viewMode === 'map' && (
            <div style={{ flex: 1, padding: 12 }}>
              <Suspense fallback={
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Loading map…
                </div>
              }>
                <EarthquakeMap />
              </Suspense>
            </div>
          )}

          {viewMode === 'list' && (
            <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-primary)' }}>
              <ListView />
            </div>
          )}

          {viewMode === 'charts' && (
            <div style={{ flex: 1, overflow: 'hidden', background: 'var(--bg-primary)' }}>
              <TrendChart />
            </div>
          )}

          {/* Attribution */}
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            fontSize: '0.65rem', color: 'var(--text-muted)',
            background: 'rgba(10,14,26,0.8)', padding: '3px 10px', borderRadius: 12,
            backdropFilter: 'blur(10px)', pointerEvents: 'none',
          }}>
            Data from <strong style={{ color: 'var(--accent-blue)' }}>USGS Earthquake Hazards Program</strong> · earthquake.usgs.gov
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEq && <EarthquakeDetailModal />}

      {/* Toasts */}
      <ToastContainer />

      {/* Spin keyframe for loading icons */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
