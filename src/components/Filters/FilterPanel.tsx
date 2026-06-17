import React, { useState } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { geocodeCity } from '../../services/api';
import { daysAgoDateString, todayDateString } from '../../utils/helpers';
import { Search, MapPin, X, Loader2, Sliders, RotateCcw } from 'lucide-react';

export default function FilterPanel() {
  const filters      = useEarthquakeStore((s) => s.filters);
  const location     = useEarthquakeStore((s) => s.location);
  const setFilters   = useEarthquakeStore((s) => s.setFilters);
  const setLocation  = useEarthquakeStore((s) => s.setLocation);
  const resetLocation = useEarthquakeStore((s) => s.resetLocation);
  const fetchData    = useEarthquakeStore((s) => s.fetchData);
  const addToast     = useEarthquakeStore((s) => s.addToast);
  const alertThreshold = useEarthquakeStore((s) => s.alertThreshold);
  const setAlertThreshold = useEarthquakeStore((s) => s.setAlertThreshold);

  const [cityQuery, setCityQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const handleGeocode = async () => {
    if (!cityQuery.trim()) return;
    setGeocoding(true);
    try {
      const result = await geocodeCity(cityQuery.trim());
      if (!result) {
        addToast('Location not found. Try a different city name.', 'error');
      } else {
        setLocation({ name: result.displayName, latitude: result.lat, longitude: result.lon });
        addToast(`📍 Searching near ${cityQuery}`, 'success');
      }
    } catch {
      addToast('Geocoding failed. Try again.', 'error');
    } finally {
      setGeocoding(false);
    }
  };

  const handleApply = () => {
    fetchData();
  };

  const handleReset = () => {
    setFilters({
      minMagnitude: 0,
      maxMagnitude: 10,
      minDepth: 0,
      maxDepth: 700,
      startDate: daysAgoDateString(7),
      endDate: todayDateString(),
      limit: 200,
      orderBy: 'time',
    });
    resetLocation();
    setCityQuery('');
  };

  // Quick presets
  const presets = [
    { label: 'Last 24h', action: () => setFilters({ startDate: daysAgoDateString(1), endDate: todayDateString() }) },
    { label: '7 Days',   action: () => setFilters({ startDate: daysAgoDateString(7), endDate: todayDateString() }) },
    { label: '30 Days',  action: () => setFilters({ startDate: daysAgoDateString(30), endDate: todayDateString() }) },
    { label: 'M5+',      action: () => setFilters({ minMagnitude: 5 }) },
    { label: 'M6+',      action: () => setFilters({ minMagnitude: 6 }) },
    { label: 'M7+',      action: () => setFilters({ minMagnitude: 7 }) },
  ];

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', height: '100%' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sliders size={15} style={{ color: 'var(--accent-blue)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Filters</span>
        <button onClick={handleReset} className="btn-icon" style={{ marginLeft: 'auto', padding: 4 }} title="Reset all">
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Quick presets */}
      <div>
        <Label>Quick Presets</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {presets.map((p) => (
            <button key={p.label} onClick={p.action} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* Location search */}
      <div>
        <Label>Location Search</Label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
              placeholder="City, country, or region…"
              className="glass-input"
              style={{ paddingLeft: 28 }}
            />
          </div>
          <button onClick={handleGeocode} disabled={geocoding} className="btn-primary" style={{ padding: '8px 12px', flexShrink: 0 }}>
            {geocoding ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={14} />}
          </button>
        </div>
        {location.name && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
            background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)',
            borderRadius: 7, fontSize: '0.72rem', color: 'var(--accent-blue)',
          }}>
            <MapPin size={11} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {location.name.split(',').slice(0, 2).join(',')}
            </span>
            <button onClick={() => { resetLocation(); setCityQuery(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
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
              onChange={(e) => setLocation({ radiusKm: Number(e.target.value) })}
            />
          </div>
        )}
      </div>

      <Divider />

      {/* Date range */}
      <div>
        <Label>Date Range</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: 3 }}>Start</div>
            <input
              type="date" value={filters.startDate}
              onChange={(e) => setFilters({ startDate: e.target.value })}
              className="glass-input" style={{ colorScheme: 'dark', fontSize: '0.78rem' }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: 3 }}>End</div>
            <input
              type="date" value={filters.endDate}
              onChange={(e) => setFilters({ endDate: e.target.value })}
              className="glass-input" style={{ colorScheme: 'dark', fontSize: '0.78rem' }}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* Magnitude */}
      <div>
        <Label>Magnitude: {filters.minMagnitude.toFixed(1)} – {filters.maxMagnitude.toFixed(1)}</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: 3 }}>Min</div>
            <input
              type="range" min={0} max={9} step={0.1}
              value={filters.minMagnitude}
              onChange={(e) => setFilters({ minMagnitude: Number(e.target.value) })}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: 3 }}>Max</div>
            <input
              type="range" min={1} max={10} step={0.1}
              value={filters.maxMagnitude}
              onChange={(e) => setFilters({ maxMagnitude: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* Depth */}
      <div>
        <Label>Depth: {filters.minDepth} – {filters.maxDepth} km</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: 3 }}>Min (km)</div>
            <input
              type="range" min={0} max={600} step={10}
              value={filters.minDepth}
              onChange={(e) => setFilters({ minDepth: Number(e.target.value) })}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginBottom: 3 }}>Max (km)</div>
            <input
              type="range" min={10} max={700} step={10}
              value={filters.maxDepth}
              onChange={(e) => setFilters({ maxDepth: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* Sort & Limit */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <Label>Sort By</Label>
          <select
            value={filters.orderBy}
            onChange={(e) => setFilters({ orderBy: e.target.value as any })}
            className="glass-input"
            style={{ colorScheme: 'dark' }}
          >
            <option value="time">Newest First</option>
            <option value="time-asc">Oldest First</option>
            <option value="magnitude">Magnitude</option>
          </select>
        </div>
        <div>
          <Label>Limit: {filters.limit}</Label>
          <input
            type="range" min={10} max={500} step={10}
            value={filters.limit}
            onChange={(e) => setFilters({ limit: Number(e.target.value) })}
          />
        </div>
      </div>

      <Divider />

      {/* Alert threshold */}
      <div>
        <Label>Alert Threshold: M{alertThreshold.toFixed(1)}+</Label>
        <input
          type="range" min={1} max={9} step={0.5}
          value={alertThreshold}
          onChange={(e) => setAlertThreshold(Number(e.target.value))}
        />
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>
          Notify when new earthquakes ≥ M{alertThreshold.toFixed(1)} appear
        </div>
      </div>

      <Divider />

      {/* Apply */}
      <button onClick={handleApply} className="btn-primary" style={{ width: '100%', padding: '10px' }}>
        Apply & Search
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border-glass)' }} />;
}
