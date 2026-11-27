import { useRef, useMemo, useCallback } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { daysAgoDateString, todayDateString } from '../../utils/helpers';

const MAGS = [
  { label: 'All', value: 0 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 },
  { label: '6+', value: 6 },
] as const;

const TIMES = [
  { label: '1 hour', hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
  { label: '30 days', hours: 24 * 30 },
] as const;

const REGIONS = [
  { label: 'Worldwide', key: 'world' },
  { label: 'Philippines', key: 'ph' },
  { label: 'Asia', key: 'asia' },
  { label: 'Custom', key: 'custom' },
] as const;

const DEPTHS = [
  { label: 'Any', min: 0, max: 700 },
  { label: 'Shallow', min: 0, max: 70 },
  { label: 'Intermediate', min: 70, max: 300 },
  { label: 'Deep', min: 300, max: 700 },
] as const;

function timeStart(hours: number): string {
  if (hours <= 24) return new Date(Date.now() - hours * 3600_000).toISOString();
  return daysAgoDateString(Math.round(hours / 24));
}

function Chip({ 
  label, 
  pressed, 
  onPress, 
  disabled = false 
}: { 
  label: string; 
  pressed: boolean; 
  onPress: () => void; 
  disabled?: boolean;
}) {
  return (
    <button
      className="chip"
      aria-pressed={pressed}
      aria-disabled={disabled}
      onClick={onPress}
      disabled={disabled}
      style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
    >
      {label}
    </button>
  );
}

function FilterGroup({ 
  id, 
  label, 
  children 
}: { 
  id: string; 
  label: string; 
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="uppercase-tracked" style={{ marginBottom: 6 }} id={id}>
        {label}
      </div>
      <div className="filter-scroll" role="group" aria-labelledby={id}>
        {children}
      </div>
    </div>
  );
}

function RegionDisplay({ 
  location, 
  onClear,
}: { 
  location: { name: string; latitude: number | null; longitude: number | null; radiusKm: number } | null;
  onClear: () => void;
}) {
  if (!location?.name || location.latitude === null || location.longitude === null) return null;
  
  return (
    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)' }} aria-live="polite">
      Region: <strong style={{ color: 'var(--p-wave)' }}>{location.name.split(',').slice(0, 2).join(',')}</strong>
      {' · '}radius {location.radiusKm} km
      {' · '}
      <button 
        onClick={onClear}
        style={{ 
          background: 'none', border: 'none', color: 'var(--p-wave)', 
          cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600 
        }}
      >
        Clear region
      </button>
    </div>
  );
}

export default function FilterBar() {
  const filters = useEarthquakeStore((s) => s.filters);
  const setFilters = useEarthquakeStore((s) => s.setFilters);
  const location = useEarthquakeStore((s) => s.location);
  const setLocation = useEarthquakeStore((s) => s.setLocation);
  const resetLocation = useEarthquakeStore((s) => s.resetLocation);
  const fetchData = useEarthquakeStore((s) => s.fetchData);
  const toggleFilter = useEarthquakeStore((s) => s.toggleFilterPanel);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applySoon = useCallback(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { fetchData(); }, 450);
  }, [fetchData]);

  const activeTimeHours = useMemo(() => {
    const start = Date.parse(filters.startDate);
    if (Number.isNaN(start)) return null;
    const h = (Date.now() - start) / 3600_000;
    if (h <= 1.5) return 1;
    if (h <= 26) return 24;
    if (h <= 24 * 8) return 24 * 7;
    if (h <= 24 * 32) return 24 * 30;
    return null;
  }, [filters.startDate]);

  const activeRegion = useMemo(() => {
    if (location.latitude === null || location.longitude === null) return 'world';
    const { latitude, longitude } = location;
    if (Math.abs(latitude - 12.8797) < 3 && Math.abs(longitude - 121.774) < 5) return 'ph';
    if (Math.abs(latitude - 30) < 4 && Math.abs(longitude - 100) < 6) return 'asia';
    return 'custom';
  }, [location.latitude, location.longitude]);

  const activeDepth = useMemo(() => {
    const { minDepth, maxDepth } = filters;
    if (minDepth === 0 && maxDepth === 700) return 'Any';
    if (minDepth === 0 && maxDepth === 70) return 'Shallow';
    if (minDepth === 70 && maxDepth === 300) return 'Intermediate';
    if (minDepth === 300 && maxDepth === 700) return 'Deep';
    return null;
  }, [filters.minDepth, filters.maxDepth]);

  return (
    <div
      className="panel"
      role="toolbar"
      aria-label="Earthquake filters"
      style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <FilterGroup id="fb-mag" label="Magnitude">
          {MAGS.map((m) => (
            <Chip
              key={m.label}
              label={m.label}
              pressed={filters.minMagnitude === m.value}
              onPress={() => { setFilters({ minMagnitude: m.value }); applySoon(); }}
            />
          ))}
        </FilterGroup>
        
        <FilterGroup id="fb-time" label="Time">
          {TIMES.map((t) => (
            <Chip
              key={t.label}
              label={t.label}
              pressed={activeTimeHours === t.hours}
              onPress={() => {
                setFilters({ startDate: timeStart(t.hours), endDate: new Date().toISOString() });
                applySoon();
              }}
            />
          ))}
        </FilterGroup>
        
        <FilterGroup id="fb-region" label="Region">
          {REGIONS.map((r) => (
            <Chip
              key={r.key}
              label={r.label}
              pressed={activeRegion === r.key}
              onPress={() => {
                if (r.key === 'world') { resetLocation(); }
                else if (r.key === 'ph') { setLocation({ name: 'Philippines', latitude: 12.8797, longitude: 121.774, radiusKm: 1400 }); }
                else if (r.key === 'asia') { setLocation({ name: 'Asia', latitude: 30, longitude: 100, radiusKm: 5000 }); }
                else { toggleFilter(); return; }
                applySoon();
              }}
            />
          ))}
        </FilterGroup>
        
        <FilterGroup id="fb-depth" label="Depth">
          {DEPTHS.map((d) => (
            <Chip
              key={d.label}
              label={d.label}
              pressed={activeDepth === d.label}
              onPress={() => { setFilters({ minDepth: d.min, maxDepth: d.max }); applySoon(); }}
            />
          ))}
        </FilterGroup>
      </div>
      
      <RegionDisplay 
        location={location}
        onClear={() => { resetLocation(); setFilters({ startDate: daysAgoDateString(7), endDate: todayDateString() }); applySoon(); }}
      />
    </div>
  );
}
