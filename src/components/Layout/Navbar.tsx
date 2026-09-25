import { useState } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { exportToCSV } from '../../utils/helpers';
import {
  Activity, Download, RefreshCw, Loader2, Sliders, Menu, X,
} from 'lucide-react';

const NAV = [
  { href: '#overview', label: 'Overview' },
  { href: '#live-map', label: 'Live Map' },
  { href: '#earthquakes', label: 'Earthquakes' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#about', label: 'About' },
];

function formatUtc(ms: number | null): string {
  if (!ms) return '—';
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
}

export default function Navbar() {
  const filterPanelOpen = useEarthquakeStore((s) => s.filterPanelOpen);
  const toggleFilter = useEarthquakeStore((s) => s.toggleFilterPanel);
  const fetchData = useEarthquakeStore((s) => s.fetchData);
  const isLoading = useEarthquakeStore((s) => s.isLoading);
  const error = useEarthquakeStore((s) => s.error);
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);
  const lastUpdated = useEarthquakeStore((s) => s.lastUpdated);
  const autoRefresh = useEarthquakeStore((s) => s.autoRefresh);
  const setAutoRefresh = useEarthquakeStore((s) => s.setAutoRefresh);
  const [menuOpen, setMenuOpen] = useState(false);

  const dotClass = error ? 'live-dot error' : autoRefresh ? 'live-dot live' : 'live-dot paused';
  const liveLabel = error ? 'OFFLINE' : isLoading ? 'UPDATING' : autoRefresh ? 'LIVE' : 'PAUSED';

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 5000,
        height: 'var(--header-h)',
        background: 'rgba(5,10,20,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        className="ss-main header-inner"
        style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        {/* Brand */}
        <a
          href="#overview"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}
          aria-label="SeismoScope — back to overview"
        >
          <span
            aria-hidden="true"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(34,211,238,0.12)',
              border: '1px solid var(--accent-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Activity size={17} style={{ color: 'var(--accent)' }} />
          </span>
          <span>
            <span className="brand-name" style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              SeismoScope
            </span>
            <span className="brand-sub" style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
              REAL-TIME EARTHQUAKE MONITOR
            </span>
          </span>
        </a>

        {/* Center nav */}
        <nav className="nav-links" aria-label="Primary" style={{ margin: '0 auto' }}>
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              style={{
                color: 'var(--text-secondary)', textDecoration: 'none',
                fontSize: '0.84rem', fontWeight: 600,
                padding: '7px 12px', borderRadius: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(148,163,184,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Live status */}
        <div
          role="status"
          aria-live="polite"
          className="live-pill"
          aria-label={error ? 'Data feed offline' : autoRefresh ? 'Live data feed active' : 'Auto-refresh paused'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            border: '1px solid var(--border)', borderRadius: 999,
            padding: '5px 11px', background: 'rgba(148,163,184,0.05)',
            flexShrink: 0,
          }}
          title={error ? 'Unable to update earthquake data' : `Last updated ${formatUtc(lastUpdated)} · Auto-refresh ${autoRefresh ? 'ON' : 'OFF'}`}
        >
          <span className={dotClass} aria-hidden="true" />
          <span style={{
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em',
            color: error ? '#f87171' : autoRefresh ? '#4ade80' : 'var(--text-secondary)',
          }}>
            {liveLabel}
          </span>
          <span className="live-utc ss-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatUtc(lastUpdated)}
          </span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            aria-pressed={autoRefresh}
            aria-label={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}
            title={`Auto-refresh ${autoRefresh ? 'ON' : 'OFF'} — toggle`}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.04em',
              color: autoRefresh ? 'var(--accent)' : 'var(--text-muted)',
              padding: '2px 4px',
            }}
          >
            {autoRefresh ? 'AUTO ON' : 'AUTO OFF'}
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={toggleFilter}
            className="btn-icon"
            aria-pressed={filterPanelOpen}
            aria-label={filterPanelOpen ? 'Close filters' : 'Open filters'}
            title="Filters"
          >
            <Sliders size={15} />
          </button>
          <button
            onClick={() => exportToCSV(earthquakes)}
            className="btn-icon nav-export-btn"
            aria-label="Export earthquakes as CSV"
            title="Export CSV"
            disabled={earthquakes.length === 0}
          >
            <Download size={15} />
          </button>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="btn-primary"
            aria-label={isLoading ? 'Updating earthquake data' : 'Refresh earthquake data now'}
            title="Refresh now"
            style={{ padding: '7px 12px' }}
          >
            {isLoading
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
              : <RefreshCw size={14} aria-hidden="true" />}
            <span className="nav-refresh-label" style={{ fontSize: '0.8rem' }}>
              {isLoading ? 'Updating…' : 'Refresh'}
            </span>
          </button>
          <button
            className="btn-icon mobile-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      <nav
        className={`mobile-nav ${menuOpen ? 'open' : ''}`}
        aria-label="Mobile"
        style={{
          borderTop: menuOpen ? '1px solid var(--border)' : 'none',
          background: 'rgba(5,10,20,0.98)',
          padding: menuOpen ? '8px 16px 12px' : 0,
        }}
      >
        {menuOpen && NAV.map((n) => (
          <a
            key={n.href}
            href={n.href}
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'block', color: 'var(--text-primary)', textDecoration: 'none',
              fontSize: '0.9rem', fontWeight: 600, padding: '10px 6px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {n.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
