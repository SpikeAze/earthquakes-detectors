import { useState, useMemo } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { exportToCSV } from '../../utils/helpers';
import type { ProcessedEarthquake } from '../../types/earthquake';
import {
  Activity, Download, RefreshCw, Loader2, Sliders, Menu, X,
} from 'lucide-react';

const NAV = [
  { href: '#overview', label: 'Overview' },
  { href: '#live-map', label: 'Live Map' },
  { href: '#earthquakes', label: 'Earthquakes' },
  { href: '#analytics', label: 'Analytics' },
  { href: '#about', label: 'About' },
] as const;

function formatUtc(ms: number | null): string {
  if (!ms) return '—';
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} UTC`;
}

function NavLink({ href, label, isActive = false }: { href: string; label: string; isActive?: boolean }) {
  return (
    <a
      href={href}
      style={{
        color: isActive ? 'var(--p-wave)' : 'var(--feldspar)',
        textDecoration: 'none',
        fontSize: 'var(--text-sm)',
        fontWeight: isActive ? 600 : 500,
        padding: '7px 12px',
        borderRadius: 'var(--radius-instrument)',
        transition: 'color 0.12s ease, background 0.12s ease',
      }}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </a>
  );
}

function LiveStatusIndicator({ 
  isLive, 
  isLoading, 
  error, 
  lastUpdated, 
  autoRefresh, 
  setAutoRefresh 
}: { 
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  autoRefresh: boolean;
  setAutoRefresh: (v: boolean) => void;
}) {
  const status = useMemo(() => {
    if (error) return { text: 'OFFLINE', color: 'var(--mag-6)', label: 'Data feed offline' };
    if (isLoading) return { text: 'UPDATING', color: 'var(--surface-wave)', label: 'Updating earthquake data' };
    if (isLive) return { text: 'LIVE', color: 'var(--p-wave)', label: 'Live data feed active' };
    return { text: 'PAUSED', color: 'var(--mica)', label: 'Auto-refresh paused' };
  }, [error, isLoading, isLive]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="live-indicator"
      aria-label={status.label}
      title={error ? 'Unable to update earthquake data' : `Last updated ${formatUtc(lastUpdated)} · Auto-refresh ${autoRefresh ? 'ON' : 'OFF'}`}
      style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}
    >
      <span style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-wider)',
        color: status.color,
        textTransform: 'uppercase',
      }}>
        {status.text}
      </span>
      <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)' }}>
        {formatUtc(lastUpdated)}
      </span>
      <button
        onClick={() => setAutoRefresh(!autoRefresh)}
        aria-pressed={autoRefresh}
        aria-label={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}
        title={`Auto-refresh ${autoRefresh ? 'ON' : 'OFF'} — toggle`}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 'var(--tracking-wide)',
          color: autoRefresh ? 'var(--p-wave)' : 'var(--mica)',
          padding: '2px 6px',
          textTransform: 'uppercase',
        }}
      >
        {autoRefresh ? 'AUTO ON' : 'AUTO OFF'}
      </button>
    </div>
  );
}

function ActionButtons({
  filterPanelOpen,
  toggleFilter,
  earthquakes,
  fetchData,
  isLoading,
  exportToCSV,
}: {
  filterPanelOpen: boolean;
  toggleFilter: () => void;
  earthquakes: ProcessedEarthquake[];
  fetchData: () => Promise<void>;
  isLoading: boolean;
  exportToCSV: (eqs: ProcessedEarthquake[]) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
      <button
        onClick={toggleFilter}
        className="btn btn-icon"
        aria-pressed={filterPanelOpen}
        aria-label={filterPanelOpen ? 'Close filters' : 'Open filters'}
        title="Filters"
      >
        <Sliders size={15} />
      </button>
      <button
        onClick={() => exportToCSV(earthquakes)}
        className="btn btn-icon nav-export-btn"
        aria-label="Export earthquakes as CSV"
        title="Export CSV"
        disabled={earthquakes.length === 0}
      >
        <Download size={15} />
      </button>
      <button
        onClick={fetchData}
        disabled={isLoading}
        className="btn btn-primary"
        aria-label={isLoading ? 'Updating earthquake data' : 'Refresh earthquake data now'}
        title="Refresh now"
        style={{ padding: '8px 14px' }}
      >
        {isLoading
          ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
          : <RefreshCw size={14} aria-hidden="true" />}
        <span className="nav-refresh-label" style={{ fontSize: 'var(--text-sm)' }}>
          {isLoading ? 'Updating…' : 'Refresh'}
        </span>
      </button>
    </div>
  );
}

function MobileNavToggle({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean | ((prev: boolean) => boolean)) => void }) {
  return (
    <button
      className="btn btn-icon mobile-menu-btn"
      onClick={() => setMenuOpen((v) => !v)}
      aria-expanded={menuOpen}
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
    >
      {menuOpen ? <X size={16} /> : <Menu size={16} />}
    </button>
  );
}

function MobileNav({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  return (
    <nav
      className={`mobile-nav ${menuOpen ? 'open' : ''}`}
      aria-label="Mobile navigation"
      style={{
        borderTop: menuOpen ? '1px solid var(--fault-line)' : 'none',
        background: 'rgba(10, 13, 14, 0.98)',
        padding: menuOpen ? '8px 0 12px' : 0,
      }}
    >
      {menuOpen && NAV.map((n, i) => (
        <a
          key={n.href}
          href={n.href}
          onClick={() => setMenuOpen(false)}
          style={{
            display: 'block', color: 'var(--quartz)', textDecoration: 'none',
            fontSize: 'var(--text-base)', fontWeight: 500, padding: '12px 0',
            borderBottom: i < NAV.length - 1 ? '1px solid var(--fault-line)' : 'none',
          }}
        >
          {n.label}
        </a>
      ))}
    </nav>
  );
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

  const isLive = autoRefresh && !error && !isLoading;

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 5000,
        height: 'var(--header-h)',
        background: 'rgba(10, 13, 14, 0.9)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--fault-line)',
      }}
    >
      <div className="content" style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Brand */}
        <a
          href="#overview"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}
          aria-label="SeismoScope — back to overview"
        >
          <span
            aria-hidden="true"
            style={{
              width: 34, height: 34, borderRadius: 'var(--radius-instrument)',
              background: 'var(--p-wave-dim)',
              border: '1px solid var(--p-wave)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Activity size={17} style={{ color: 'var(--p-wave)' }} />
          </span>
          <span>
            <span className="brand-name" style={{ display: 'block', fontWeight: 600, fontSize: 'var(--text-lg)', letterSpacing: 'var(--tracking-tight)', color: 'var(--quartz)', lineHeight: 1.1 }}>
              SeismoScope
            </span>
            <span className="brand-sub uppercase-tracked" style={{ display: 'block', fontSize: 'var(--text-xs)' }}>
              Real-time seismic monitor
            </span>
          </span>
        </a>

        {/* Center nav */}
        <nav className="nav-links" aria-label="Primary" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          {NAV.map((n) => (
            <NavLink key={n.href} href={n.href} label={n.label} />
          ))}
        </nav>

        {/* Live status */}
        <LiveStatusIndicator
          isLive={isLive}
          isLoading={isLoading}
          error={error}
          lastUpdated={lastUpdated}
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
        />

        {/* Actions */}
        <ActionButtons
          filterPanelOpen={filterPanelOpen}
          toggleFilter={toggleFilter}
          earthquakes={earthquakes}
          fetchData={fetchData}
          isLoading={isLoading}
          exportToCSV={exportToCSV}
        />

        <MobileNavToggle menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      </div>

      <MobileNav menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    </header>
  );
}
