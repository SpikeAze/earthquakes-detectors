import { useEarthquakeStore } from '../../store/earthquakeStore';
import { exportToCSV } from '../../utils/helpers';
import type { ViewMode } from '../../types/earthquake';
import {
  Activity, Map, List, BarChart2, Sliders,
  Download, RefreshCw, Loader2, Waves, Zap, ListFilter,
} from 'lucide-react';

export default function Navbar() {
  const viewMode          = useEarthquakeStore((s) => s.viewMode);
  const setViewMode       = useEarthquakeStore((s) => s.setViewMode);
  const filterPanelOpen   = useEarthquakeStore((s) => s.filterPanelOpen);
  const toggleFilter      = useEarthquakeStore((s) => s.toggleFilterPanel);
  const feedOpen          = useEarthquakeStore((s) => s.feedOpen);
  const toggleFeed        = useEarthquakeStore((s) => s.toggleFeed);
  const fetchData         = useEarthquakeStore((s) => s.fetchData);
  const isLoading         = useEarthquakeStore((s) => s.isLoading);
  const earthquakes       = useEarthquakeStore((s) => s.earthquakes);

  const bigOnes  = earthquakes.filter((e) => e.magnitude >= 6).length;
  const tsunamis = earthquakes.filter((e) => e.tsunami).length;

  const views: { key: ViewMode; icon: React.ReactNode; label: string }[] = [
    { key: 'map',    icon: <Map size={15} />,       label: 'Map' },
    { key: 'list',   icon: <List size={15} />,      label: 'List' },
    { key: 'charts', icon: <BarChart2 size={15} />, label: 'Charts' },
  ];

  return (
    <header style={{
      height: 56,
      background: 'rgba(10,14,26,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-glass)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12, flexShrink: 0, zIndex: 100,
    }}>
      {/* Feed toggle (hamburger) — visible on mobile/tablet */}
      <button
        onClick={toggleFeed}
        className={`btn-icon feed-toggle-btn ${feedOpen ? 'active' : ''}`}
        title="Toggle feed"
        style={{ flexShrink: 0 }}
      >
        <ListFilter size={15} />
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(79,142,247,0.4)',
        }}>
          <Activity size={16} style={{ color: 'white' }} />
        </div>
        <div>
          <div className="nav-brand-name" style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.3px' }}>
            SeismoScope
          </div>
          <div className="nav-brand-sub" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
            USGS · REAL-TIME
          </div>
        </div>
      </div>

      {/* Status indicators — hidden on mobile */}
      <div className="nav-status-badges" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 600 }}>LIVE</span>
        </div>

        {earthquakes.length > 0 && (
          <>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '2px 8px', border: '1px solid var(--border-glass)', borderRadius: 12 }}>
              {earthquakes.length} events
            </div>
            {bigOnes > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#f87171', padding: '2px 8px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, background: 'rgba(239,68,68,0.08)' }}>
                <Zap size={10} /> {bigOnes} M6+
              </div>
            )}
            {tsunamis > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#60a5fa', padding: '2px 8px', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 12, background: 'rgba(96,165,250,0.08)' }}>
                <Waves size={10} /> {tsunamis} tsunami
              </div>
            )}
          </>
        )}
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 2, marginLeft: 'auto' }}>
        {views.map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 6, border: 'none',
              background: viewMode === key ? 'rgba(79,142,247,0.2)' : 'transparent',
              color: viewMode === key ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {icon} <span className="nav-tab-label">{label}</span>
          </button>
        ))}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={toggleFilter}
          className={`btn-icon ${filterPanelOpen ? 'active' : ''}`}
          title="Filters"
        >
          <Sliders size={15} />
        </button>
        <button
          onClick={() => exportToCSV(earthquakes)}
          className="btn-icon nav-export"
          title="Export CSV"
          disabled={earthquakes.length === 0}
        >
          <Download size={15} />
        </button>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="btn-primary nav-refresh"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.8rem' }}
        >
          {isLoading
            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /></>
            : <><RefreshCw size={14} /></>
          }
        </button>
      </div>
    </header>
  );
}
