import { useState, useRef, useEffect } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { geocodeCity } from '../../services/api';
import { daysAgoDateString, todayDateString } from '../../utils/helpers';
import type { FilterState } from '../../types/earthquake';
import { Search, MapPin, X, Loader2, Sliders, RotateCcw } from 'lucide-react';

const dateForInput = (v: string) => (v.length > 10 ? v.slice(0, 10) : v);

export default function FilterPanel() {
  const filters = useEarthquakeStore((s) => s.filters);
  const location = useEarthquakeStore((s) => s.location);
  const setFilters = useEarthquakeStore((s) => s.setFilters);
  const setLocation = useEarthquakeStore((s) => s.setLocation);
  const resetLocation = useEarthquakeStore((s) => s.resetLocation);
  const fetchData = useEarthquakeStore((s) => s.fetchData);
  const addToast = useEarthquakeStore((s) => s.addToast);
  const alertThreshold = useEarthquakeStore((s) => s.alertThreshold);
  const setAlertThreshold = useEarthquakeStore((s) => s.setAlertThreshold);

  const [cityQuery, setCityQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current); };
  }, []);

  const performGeocode = async (query: string) => {
    setGeocoding(true);
    try {
      const result = await geocodeCity(query);
      if (!result) {
        addToast('Location not found. Try a different city name.', 'error');
      } else {
        setLocation({ name: result.displayName, latitude: result.lat, longitude: result.lon });
        addToast(`Searching near ${query}`, 'success');
      }
    } catch {
      addToast('Geocoding failed. Try again.', 'error');
    } finally {
      setGeocoding(false);
    }
  };

  const handleGeocode = () => {
    if (!cityQuery.trim()) return;
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    geocodeTimeoutRef.current = setTimeout(() => { performGeocode(cityQuery.trim()); }, 600);
  };

  const handleReset = () => {
    setFilters({
      minMagnitude: 0, maxMagnitude: 10, minDepth: 0, maxDepth: 700,
      startDate: daysAgoDateString(7), endDate: todayDateString(),
      limit: 200, orderBy: 'time',
    });
    resetLocation();
    setCityQuery('');
  };

  const presets = [
    { label: 'Last 24h', action: () => setFilters({ startDate: daysAgoDateString(1), endDate: todayDateString() }) },
    { label: '7 Days', action: () => setFilters({ startDate: daysAgoDateString(7), endDate: todayDateString() }) },
    { label: '30 Days', action: () => setFilters({ startDate: daysAgoDateString(30), endDate: todayDateString() }) },
    { label: 'M5+', action: () => setFilters({ minMagnitude: 5 }) },
    { label: 'M6+', action: () => setFilters({ minMagnitude: 6 }) },
    { label: 'Shallow', action: () => setFilters({ minDepth: 0, maxDepth: 70 }) },
  ];

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sliders size={15} style={{ color: 'var(--accent)' }} aria-hidden="true" />
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Advanced filters</h2>
        <button onClick={handleReset} className="btn-icon" style={{ marginLeft: 'auto', padding: 5 }} title="Reset all filters" aria-label="Reset all filters">
          <RotateCcw size={13} />
        </button>
      </div>

      <div>
        <Label>Quick presets</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {presets.map((p) => (
            <button key={p.label} onClick={p.action} className="chip">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <Label>Location search</Label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} aria-hidden="true" />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
              placeholder="City, country, or region…"
              className="glass-input"
              style={{ paddingLeft: 28 }}
              aria-label="Search for a city or region"
            />
          </div>
          <button onClick={handleGeocode} disabled={geocoding} className="btn-primary" style={{ padding: '8px 12px' }} aria-label="Search location">
            {geocoding ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={14} />}
          </button>
        </div>
        {location.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 8, fontSize: '0.74rem', color: 'var(--accent)' }}>
            <MapPin size={11} style={{ flexShrink: 0 }} aria-hidden="true" />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {location.name.split(',').slice(0, 2).join(',')}
            </span>
            <button onClick={() => { resetLocation(); setCityQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }} aria-label="Clear location">
              <X size={12} />
            </button>
          </div>
        )}
        {location.latitude !== null && (
          <div style={{ marginTop: 8 }}>
            <Label>Radius: {location.radiusKm} km</Label>
            <input
              type="range" min={100} max={5000} step={100}
              value={location.radiusKm}
              onChange={(e) => setLocation({ radiusKm: Math.max(100, Math.min(5000, Number(e.target.value) || 100)) })}
              aria-label="Search radius in kilometers"
            />
          </div>
        )}
      </div>

      <Divider />

      <div>
        <Label>Date range</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Start</div>
            <input
              type="date" value={dateForInput(filters.startDate)}
              onChange={(e) => setFilters({ startDate: e.target.value })}
              className="glass-input" style={{ colorScheme: 'dark', fontSize: '0.8rem' }}
              aria-label="Start date"
            />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>End</div>
            <input
              type="date" value={dateForInput(filters.endDate)}
              onChange={(e) => setFilters({ endDate: e.target.value })}
              className="glass-input" style={{ colorScheme: 'dark', fontSize: '0.8rem' }}
              aria-label="End date"
            />
          </div>
        </div>
      </div>

      <Divider />

      <div>
        <Label>Magnitude: {filters.minMagnitude.toFixed(1)} – {filters.maxMagnitude.toFixed(1)}</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Min</div>
            <input type="range" min={0} max={9} step={0.1} value={filters.minMagnitude} aria-label="Minimum magnitude"
              onChange={(e) => {
                const val = Number(e.target.value);
                setFilters({ minMagnitude: Math.min(Math.max(0, Math.min(val, filters.maxMagnitude - 0.1)), 9) });
              }} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 3 }}>Max</div>
            <input type="range" min={1} max={10} step={0.1} value={filters.maxMagnitude} aria-label="Maximum magnitude"
              onChange={(e) => {
                const val = Number(e.target.value);
                setFilters({ maxMagnitude: Math.min(Math.max(Math.max(val, filters.minMagnitude + 0.1), 1), 10) });
              }} />
          </div>
        </div>
      </div>

      <Divider />

      <div>
        <Label>Depth: {filters.minDepth} – {filters.maxDepth} km</Label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          {[
            { l: 'Any', a: 0, b: 700 },
            { l: 'Shallow', a: 0, b: 70 },
            { l: 'Intermediate', a: 70, b: 300 },
            { l: 'Deep', a: 300, b: 700 },
          ].map((d) => (
            <button key={d.l} className="chip" aria-pressed={filters.minDepth === d.a && filters.maxDepth === d.b}
              onClick={() => setFilters({ minDepth: d.a, maxDepth: d.b })}>
              {d.l}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input type="range" min={0} max={600} step={10} value={filters.minDepth} aria-label="Minimum depth in kilometers"
            onChange={(e) => setFilters({ minDepth: Math.min(Math.max(0, Math.min(Number(e.target.value), filters.maxDepth - 10)), 600) })} />
          <input type="range" min={10} max={700} step={10} value={filters.maxDepth} aria-label="Maximum depth in kilometers"
            onChange={(e) => setFilters({ maxDepth: Math.min(Math.max(Math.max(Number(e.target.value), filters.minDepth + 10), 10), 700) })} />
        </div>
      </div>

      <Divider />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <Label>Sort by</Label>
          <select value={filters.orderBy} onChange={(e) => setFilters({ orderBy: e.target.value as FilterState['orderBy'] })}
            className="glass-input" style={{ colorScheme: 'dark' }} aria-label="Sort order for API query">
            <option value="time">Newest first</option>
            <option value="time-asc">Oldest first</option>
            <option value="magnitude">Highest magnitude</option>
            <option value="magnitude-asc">Lowest magnitude</option>
          </select>
        </div>
        <div>
          <Label>Limit: {filters.limit}</Label>
          <input type="range" min={10} max={500} step={10} value={filters.limit} aria-label="Maximum number of events"
            onChange={(e) => setFilters({ limit: Math.max(10, Math.min(500, Number(e.target.value) || 10)) })} />
        </div>
      </div>

      <Divider />

      <div>
        <Label>Alert threshold: M{alertThreshold.toFixed(1)}+</Label>
        <input type="range" min={1} max={9} step={0.5} value={alertThreshold} aria-label="Alert threshold magnitude"
          onChange={(e) => setAlertThreshold(Math.max(1, Math.min(9, Number(e.target.value) || 5)))} />
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
          Notify when new earthquakes ≥ M{alertThreshold.toFixed(1)} appear
        </div>
      </div>

      <Divider />

      <button onClick={() => fetchData()} className="btn-primary" style={{ width: '100%', padding: '10px', justifyContent: 'center' }}>
        Apply &amp; search
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)' }} aria-hidden="true" />;
}
