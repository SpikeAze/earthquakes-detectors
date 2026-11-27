import { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { useEarthquakeStore } from './store/earthquakeStore';
import type { ProcessedEarthquake } from './types/earthquake';
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
import { getMagnitudeCssVars, safeUsgsUrl } from './utils/helpers';
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
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', fontSize: 'var(--text-sm)', minWidth: 760 }}>
        <thead>
          <tr style={{ color: 'var(--mica)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>
            {['Mag', 'Category', 'Location', 'Depth (km)', 'Lat', 'Lon', 'Time', 'Felt', 'Link'].map((h) => (
              <th key={h} scope="col" style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--fault-line)', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--stratum-1)', zIndex: 1 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {earthquakes.map((eq) => {
            const cssVars = getMagnitudeCssVars(eq.magnitude);
            const usgs = safeUsgsUrl(eq.url);
            return (
              <tr key={eq.id} onClick={() => setSelected(eq)} style={{ cursor: 'pointer', background: 'transparent' }} tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setSelected(eq); }}>
                <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: 'var(--eq-color)', borderRadius: 'var(--radius-instrument) 0 0 var(--radius-instrument)', ...cssVars }}>{eq.magnitude.toFixed(1)}</td>
                <td style={{ padding: '10px 12px' }}><span className={`mag-badge mag-${eq.category}`}>{eq.category}</span></td>
                <td style={{ padding: '10px 12px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eq.place}</td>
                <td className="mono" style={{ padding: '10px 12px', color: 'var(--feldspar)' }}>{eq.depth.toFixed(1)}</td>
                <td className="mono" style={{ padding: '10px 12px', color: 'var(--mica)' }}>{eq.latitude.toFixed(2)}</td>
                <td className="mono" style={{ padding: '10px 12px', color: 'var(--mica)' }}>{eq.longitude.toFixed(2)}</td>
                <td style={{ padding: '10px 12px', color: 'var(--mica)', whiteSpace: 'nowrap' }}>
                  {new Date(eq.time).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--mica)' }}>{eq.felt ?? '—'}</td>
                <td style={{ padding: '10px 12px', borderRadius: '0 var(--radius-instrument) var(--radius-instrument) 0' }}>
                  {usgs ? (
                    <a href={usgs} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--p-wave)', textDecoration: 'none', fontSize: 'var(--text-xs)' }}>USGS ↗</a>
                  ) : (
                    <span style={{ color: 'var(--mica)', fontSize: 'var(--text-xs)' }}>—</span>
                  )}
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

  // Exponential backoff + jitter for auto-refresh to prevent thundering herd
  useEffect(() => {
    if (!autoRefresh) return;

    const BASE_INTERVAL = 5 * 60 * 1000; // 5 minutes base
    const MAX_INTERVAL = 15 * 60 * 1000; // 15 minutes max
    const MAX_RETRIES = 10; // Prevent infinite loop on persistent failures
    let currentInterval = BASE_INTERVAL;
    let retryCount = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    const addToast = useEarthquakeStore.getState().addToast;

    const scheduleNext = () => {
      // Add jitter: ±25% of current interval
      const jitter = currentInterval * 0.25 * (Math.random() * 2 - 1);
      const delay = Math.min(Math.max(BASE_INTERVAL, currentInterval + jitter), MAX_INTERVAL);

      timeoutId = setTimeout(async () => {
        try {
          await fetchData();
          // Success: reset to base interval and retry count
          currentInterval = BASE_INTERVAL;
          retryCount = 0;
        } catch {
          // Failure: exponential backoff (capped at MAX_INTERVAL)
          currentInterval = Math.min(currentInterval * 2, MAX_INTERVAL);
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            addToast('Auto-refresh paused after repeated failures. Click Refresh to retry.', 'warning');
            // Disable auto-refresh via store
            useEarthquakeStore.getState().setAutoRefresh(false);
            return; // Stop scheduling
          }
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, [fetchData, autoRefresh]);

  useEffect(() => {
    if (!filterPanelOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') toggleFilter(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filterPanelOpen, toggleFilter]);

  const stats = useMemo(() => {
    if (earthquakes.length === 0) return null;
    const sorted = [...earthquakes].sort((a: ProcessedEarthquake, b: ProcessedEarthquake) => b.magnitude - a.magnitude);
    const strongest = sorted[0];
    const networks = new Set(earthquakes.map((e) => e.network).filter(Boolean)).size;
    const maxStations = Math.max(...earthquakes.map((e) => e.stationCount ?? 0));
    return { strongest, networks, maxStations };
  }, [earthquakes]);

  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">Skip to earthquake data</a>
      <Navbar />

      <main id="main-content" style={{ flex: 1, paddingBottom: 8 }}>
        {/* ── Overview ── */}
        <section id="overview" className="content" style={{ scrollMarginTop: 72, paddingTop: 24, paddingBottom: 8 }}>
          <p className="uppercase-tracked" style={{ margin: '0 0 8px' }}>Seismic observation · global</p>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(var(--text-2xl), 4vw, var(--text-3xl))', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}>
            Real-Time Earthquake Monitor
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 'var(--text-base)', color: 'var(--feldspar)', lineHeight: 'var(--leading-relaxed)' }}>
            Track global seismic activity as it happens. Live data from USGS.
          </p>

          <LiveStatus />

          <div className="stat-grid" style={{ marginTop: 16 }} role="group" aria-label="Key seismic statistics">
            <StatCard
              label="Earthquakes detected"
              value={earthquakes.length ? String(earthquakes.length) : '—'}
              sub={totalCount ? `${totalCount} events in USGS catalog window` : 'Awaiting first sync'}
              icon={<Activity size={15} />}
              accent="p-wave"
            />
            <StatCard
              label="Strongest earthquake"
              value={stats ? `M ${stats.strongest.magnitude.toFixed(1)}` : '—'}
              sub={stats ? stats.strongest.place.slice(0, 48) : 'Awaiting data'}
              icon={<Gauge size={15} />}
              accent="s-wave"
            />
            <StatCard
              label="Seismic networks"
              value={stats ? `${stats.networks} reporting` : '—'}
              sub={stats && stats.maxStations > 0 ? `Up to ${stats.maxStations} stations on a single event` : 'Derived from live USGS feed'}
              icon={<RadioTower size={15} />}
              accent="surface-wave"
            />
            <StatCard
              label="Last update"
              value={utcTime(lastUpdated)}
              sub={`Auto-refresh ${autoRefresh ? 'ON · every 5 min' : 'OFF · manual only'}`}
              icon={<Clock size={15} />}
              accent="p-wave"
            />
          </div>
        </section>

        {/* ── Filters ── */}
        <section className="content" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <FilterBar />
        </section>

        {/* ── Map + list ── */}
        <section className="content grid-map-list" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div id="live-map" className="panel-elevated" style={{ overflow: 'hidden', scrollMarginTop: 72, display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--fault-line)', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)' }}>Live Map</h2>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--mica)' }}>{earthquakes.length} events · marker size = magnitude</span>
            </div>
            <div className="map-height" style={{ flex: 1, minHeight: 0 }}>
              <Suspense fallback={<div role="status" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mica)' }}>Loading map…</div>}>
                <EarthquakeMap />
              </Suspense>
            </div>
          </div>

          <div id="earthquakes" className="panel-elevated" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, scrollMarginTop: 72, maxHeight: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 12px 6px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)' }}>Latest Earthquakes</h2>
              <div role="group" aria-label="List display mode" style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                <button className="btn btn-icon" aria-pressed={!tableMode} title="Comfortable rows" aria-label="Show as rows" onClick={() => setTableMode(false)} style={{ padding: 6 }}>
                  <Rows3 size={14} />
                </button>
                <button className="btn btn-icon" aria-pressed={tableMode} title="Dense table" aria-label="Show as table" onClick={() => setTableMode(true)} style={{ padding: 6 }}>
                  <Table2 size={14} />
                </button>
              </div>
            </div>
            <div className="list-height" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {tableMode ? (
                <div style={{ padding: '0 8px 12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <DenseTable />
                </div>
              ) : (
                <EarthquakeList />
              )}
            </div>
          </div>
        </section>

        {/* ── Waveform ── */}
        <section className="content" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <Waveform />
        </section>

        {/* ── Analytics ── */}
        <section className="content" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div id="analytics" className="panel-elevated" style={{ scrollMarginTop: 72, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 0' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', marginBottom: 6 }}>Analytics</h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--feldspar)', margin: 0, lineHeight: 'var(--leading-relaxed)' }}>Frequency, magnitude trends, and distribution — computed live from the current filter set.</p>
            </div>
            <div className="analytics-height" style={{ minHeight: 0, padding: '0 16px 16px' }}>
              <TrendChart />
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="content" style={{ paddingTop: 8, paddingBottom: 24 }}>
          <About />
        </section>
      </main>

      <Footer />
      <MobileNav />

      {/* ── Advanced filter drawer ── */}
      {filterPanelOpen && (
        <div role="dialog" aria-modal="true" aria-label="Advanced filters">
          <div
            onClick={toggleFilter}
            className="overlay-backdrop"
          />
          <aside className="drawer">
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 0' }}>
              <button onClick={toggleFilter} className="btn btn-secondary" style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)' }}>
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
          .content { padding-left: 14px; padding-right: 14px; }
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
