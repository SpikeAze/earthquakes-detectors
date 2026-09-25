import { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { useEarthquakeStore } from './store/earthquakeStore';
import Navbar from './components/Layout/Navbar';
import MobileNav from './components/Layout/MobileNav';
import ToastContainer from './components/Layout/ToastContainer';
import StatCard from './components/Dashboard/StatCard';
import LiveStatus from './components/Dashboard/LiveStatus';
import FilterBar from './components/Dashboard/FilterBar';
import EarthquakeList from './components/Feed/EarthquakeList';
import EarthquakeDetails from './components/Details/EarthquakeDetails';
import Waveform from './components/Dashboard/Waveform';
import About from './components/Dashboard/About';
import Footer from './components/Dashboard/Footer';
import FilterPanel from './components/Filters/FilterPanel';
import TrendChart from './components/Charts/TrendChart';
import { getMagnitudeColor } from './utils/helpers';
import { Activity, Gauge, RadioTower, Clock, X, Rows3, Table2 } from 'lucide-react';

const EarthquakeMap = lazy(() => import('./components/Map/EarthquakeMap'));

function utcTime(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toISOString().slice(11, 19) + ' UTC';
}

function DenseTable() {
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);
  const setSelected = useEarthquakeStore((s) => s.setSelectedEarthquake);
  return (
    <div style={{ overflow: 'auto', maxHeight: 520 }} role="region" aria-label="Earthquake data table" tabIndex={0}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', fontSize: '0.8rem', minWidth: 760 }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {['Mag', 'Category', 'Location', 'Depth (km)', 'Lat', 'Lon', 'Time', 'Felt', 'Link'].map((h) => (
              <th key={h} scope="col" style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {earthquakes.map((eq) => {
            const color = getMagnitudeColor(eq.magnitude);
            return (
              <tr key={eq.id} onClick={() => setSelected(eq)} style={{ cursor: 'pointer', background: 'rgba(148,163,184,0.04)' }} tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelected(eq); }}>
                <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color, borderRadius: '8px 0 0 8px' }}>{eq.magnitude.toFixed(1)}</td>
                <td style={{ padding: '8px 10px' }}><span className={`mag-badge mag-${eq.category}`}>{eq.category}</span></td>
                <td style={{ padding: '8px 10px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.place}</td>
                <td className="ss-mono" style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{eq.depth.toFixed(1)}</td>
                <td className="ss-mono" style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{eq.latitude.toFixed(2)}</td>
                <td className="ss-mono" style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{eq.longitude.toFixed(2)}</td>
                <td style={{ padding: '8px 10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(eq.time).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{eq.felt ?? '—'}</td>
                <td style={{ padding: '8px 10px', borderRadius: '0 8px 8px 0' }}>
                  <a href={eq.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.74rem' }}>USGS ↗</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const fetchData = useEarthquakeStore((s) => s.fetchData);
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);
  const totalCount = useEarthquakeStore((s) => s.totalCount);
  const lastUpdated = useEarthquakeStore((s) => s.lastUpdated);
  const autoRefresh = useEarthquakeStore((s) => s.autoRefresh);
  const filterPanelOpen = useEarthquakeStore((s) => s.filterPanelOpen);
  const toggleFilter = useEarthquakeStore((s) => s.toggleFilterPanel);
  const selected = useEarthquakeStore((s) => s.selectedEarthquake);
  const [tableMode, setTableMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { fetchData(); }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData, autoRefresh]);

  useEffect(() => {
    if (!filterPanelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggleFilter(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filterPanelOpen, toggleFilter]);

  const stats = useMemo(() => {
    if (earthquakes.length === 0) return null;
    const sorted = [...earthquakes].sort((a, b) => b.magnitude - a.magnitude);
    const strongest = sorted[0];
    const networks = new Set(earthquakes.map((e) => e.network).filter(Boolean)).size;
    const maxStations = Math.max(...earthquakes.map((e) => e.stationCount ?? 0));
    return { strongest, networks, maxStations };
  }, [earthquakes]);

  return (
    <div className="ss-shell ss-has-bottomnav">
      <a href="#main-content" className="skip-link">Skip to earthquake data</a>
      <Navbar />

      <main id="main-content" style={{ flex: 1, paddingBottom: 8 }}>
        {/* ── Overview ── */}
        <div id="overview" className="ss-main" style={{ scrollMarginTop: 72, paddingTop: 20 }}>
          <p className="ss-section-label" style={{ margin: '0 0 6px' }}>Seismic observation · global</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3.2vw, 2.1rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Real-Time Earthquake Monitor
          </h1>
          <p className="ss-sub" style={{ margin: '6px 0 14px', fontSize: '0.95rem' }}>
            Track global seismic activity as it happens.
          </p>

          <LiveStatus />

          <div className="stat-grid" style={{ marginTop: 12 }} role="group" aria-label="Key seismic statistics">
            <StatCard
              label="Earthquakes detected"
              value={earthquakes.length ? String(earthquakes.length) : '—'}
              sub={totalCount ? `${totalCount} events in USGS catalog window` : 'Awaiting first sync'}
              icon={<Activity size={15} />}
            />
            <StatCard
              label="Strongest earthquake"
              value={stats ? `M ${stats.strongest.magnitude.toFixed(1)}` : '—'}
              sub={stats ? stats.strongest.place.slice(0, 48) : 'Awaiting data'}
              icon={<Gauge size={15} />}
              accent={stats ? getMagnitudeColor(stats.strongest.magnitude) : undefined}
            />
            <StatCard
              label="Seismic networks"
              value={stats ? `${stats.networks} reporting` : '—'}
              sub={stats && stats.maxStations > 0 ? `Up to ${stats.maxStations} stations on a single event` : 'Derived from live USGS feed'}
              icon={<RadioTower size={15} />}
            />
            <StatCard
              label="Last update"
              value={utcTime(lastUpdated)}
              sub={`Auto-refresh ${autoRefresh ? 'ON · every 5 min' : 'OFF · manual only'}`}
              icon={<Clock size={15} />}
            />
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="ss-main" style={{ marginTop: 14 }}>
          <FilterBar />
        </div>

        {/* ── Map + list ── */}
        <div className="ss-main ss-grid-map-list" style={{ marginTop: 14 }}>
          <section id="live-map" aria-labelledby="map-title" className="ss-card" style={{ overflow: 'hidden', scrollMarginTop: 72 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <h2 id="map-title" className="ss-h2">Live Map</h2>
              <span className="ss-meta" aria-live="polite">{earthquakes.length} events · marker size = magnitude</span>
            </div>
            <div className="map-height" style={{ height: 540 }}>
              <Suspense fallback={<div role="status" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading map…</div>}>
                <EarthquakeMap />
              </Suspense>
            </div>
          </section>

          <section id="earthquakes" aria-labelledby="quakes-title" className="ss-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, scrollMarginTop: 72 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 12px 4px' }}>
              <h2 id="quakes-title" className="ss-h2">Latest Earthquakes</h2>
              <div role="group" aria-label="List display mode" style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button className="btn-icon" aria-pressed={!tableMode} title="Comfortable rows" aria-label="Show as rows" onClick={() => setTableMode(false)} style={{ padding: 6 }}>
                  <Rows3 size={14} />
                </button>
                <button className="btn-icon" aria-pressed={tableMode} title="Dense table" aria-label="Show as table" onClick={() => setTableMode(true)} style={{ padding: 6 }}>
                  <Table2 size={14} />
                </button>
              </div>
            </div>
            <div className="list-height" style={{ height: 540, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {tableMode ? (
                <div style={{ padding: '0 8px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <DenseTable />
                </div>
              ) : (
                <EarthquakeList />
              )}
            </div>
          </section>
        </div>

        {/* ── Waveform ── */}
        <div className="ss-main" style={{ marginTop: 14 }}>
          <Waveform />
        </div>

        {/* ── Analytics ── */}
        <div className="ss-main" style={{ marginTop: 14 }}>
          <section id="analytics" aria-labelledby="analytics-title" className="ss-card" style={{ scrollMarginTop: 72, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 0' }}>
              <h2 id="analytics-title" className="ss-h2">Analytics</h2>
              <p className="ss-sub">Frequency, magnitude trends, and distribution — computed live from the current filter set.</p>
            </div>
            <div className="analytics-height" style={{ minHeight: 0 }}>
              <TrendChart />
            </div>
          </section>
        </div>

        {/* ── About ── */}
        <div className="ss-main" style={{ marginTop: 14 }}>
          <About />
        </div>
      </main>

      <Footer />
      <MobileNav />

      {/* ── Advanced filter drawer ── */}
      {filterPanelOpen && (
        <div role="dialog" aria-modal="true" aria-label="Advanced filters">
          <div
            onClick={toggleFilter}
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(2,6,14,0.6)' }}
          />
          <aside
            style={{
              position: 'fixed', top: 0, bottom: 0, right: 0, zIndex: 9001,
              width: 360, maxWidth: '92vw', background: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border-strong)', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 0' }}>
              <button onClick={toggleFilter} className="btn-ghost" style={{ marginLeft: 'auto', fontSize: '0.78rem' }}>
                <X size={13} aria-hidden="true" /> Close
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <FilterPanel />
            </div>
          </aside>
        </div>
      )}

      {selected && <EarthquakeDetails key={selected.id} />}
      <ToastContainer />

      <style>{`
        /* Fluid map/list heights: px fallback first, then dynamic
           viewport units so phones with collapsing URL bars stay correct. */
        .map-height, .list-height { height: 540px; height: clamp(420px, 62dvh, 560px); }
        @media (max-width: 1080px) {
          .map-height { height: 440px; height: clamp(360px, 55dvh, 480px); }
          .list-height { height: 460px !important; }
        }
        @media (max-width: 640px) {
          .map-height { height: 380px; height: clamp(320px, 48dvh, 420px); }
          .list-height { height: 460px !important; height: clamp(380px, 60dvh, 480px) !important; }
          .ss-main { padding-left: 12px; padding-right: 12px; }
        }
        /* Landscape phones/tablets: cap heights to viewport so content stays reachable */
        @media (max-height: 500px) and (orientation: landscape) {
          .map-height { height: 82dvh; }
          .list-height { height: 72dvh !important; }
        }
      `}</style>
    </div>
  );
}
