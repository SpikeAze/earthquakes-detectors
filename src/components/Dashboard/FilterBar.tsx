import { useRef } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { daysAgoDateString, todayDateString } from '../../utils/helpers';

const MAGS = [
  { label: 'All', value: 0 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 },
  { label: '6+', value: 6 },
];

const TIMES = [
  { label: '1 hour', hours: 1 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
  { label: '30 days', hours: 24 * 30 },
];

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
];

function timeStart(hours: number): string {
  if (hours <= 24) return new Date(Date.now() - hours * 3600_000).toISOString();
  return daysAgoDateString(Math.round(hours / 24));
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

  const applySoon = () => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { fetchData(); }, 450);
  };

  const activeTimeHours = (() => {
    const start = Date.parse(filters.startDate);
    if (Number.isNaN(start)) return null;
    // eslint-disable-next-line react-hooks/purity -- wall-clock read for chip highlight only; no state derived
    const h = (Date.now() - start) / 3600_000;
    if (h <= 1.5) return 1;
    if (h <= 26) return 24;
    if (h <= 24 * 8) return 24 * 7;
    if (h <= 24 * 32) return 24 * 30;
    return null;
  })();

  const activeRegion = (() => {
    if (location.latitude === null || location.longitude === null) return 'world';
    const { latitude, longitude } = location;
    if (Math.abs(latitude - 12.8797) < 3 && Math.abs(longitude - 121.774) < 5) return 'ph';
    if (Math.abs(latitude - 30) < 4 && Math.abs(longitude - 100) < 6) return 'asia';
    return 'custom';
  })();

  const activeDepth = (() => {
    const { minDepth, maxDepth } = filters;
    if (minDepth === 0 && maxDepth === 700) return 'Any';
    if (minDepth === 0 && maxDepth === 70) return 'Shallow';
    if (minDepth === 70 && maxDepth === 300) return 'Intermediate';
    if (minDepth === 300 && maxDepth === 700) return 'Deep';
    return null;
  })();

  return (
    <div
      className="ss-card"
      role="toolbar"
      aria-label="Earthquake filters"
      style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        <div>
          <div className="ss-section-label" style={{ marginBottom: 6 }} id="fb-mag">Magnitude</div>
          <div className="filter-scroll" role="group" aria-labelledby="fb-mag">
            {MAGS.map((m) => (
              <button
                key={m.label}
                className="chip"
                aria-pressed={filters.minMagnitude === m.value}
                onClick={() => { setFilters({ minMagnitude: m.value }); applySoon(); }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="ss-section-label" style={{ marginBottom: 6 }} id="fb-time">Time</div>
          <div className="filter-scroll" role="group" aria-labelledby="fb-time">
            {TIMES.map((t) => (
              <button
                key={t.label}
                className="chip"
                aria-pressed={activeTimeHours === t.hours}
                onClick={() => {
                  setFilters({ startDate: timeStart(t.hours), endDate: new Date().toISOString() });
                  applySoon();
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="ss-section-label" style={{ marginBottom: 6 }} id="fb-region">Region</div>
          <div className="filter-scroll" role="group" aria-labelledby="fb-region">
            {REGIONS.map((r) => (
              <button
                key={r.key}
                className="chip"
                aria-pressed={activeRegion === r.key}
                onClick={() => {
                  if (r.key === 'world') { resetLocation(); }
                  else if (r.key === 'ph') { setLocation({ name: 'Philippines', latitude: 12.8797, longitude: 121.774, radiusKm: 1400 }); }
                  else if (r.key === 'asia') { setLocation({ name: 'Asia', latitude: 30, longitude: 100, radiusKm: 5000 }); }
                  else { toggleFilter(); return; }
                  applySoon();
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="ss-section-label" style={{ marginBottom: 6 }} id="fb-depth">Depth</div>
          <div className="filter-scroll" role="group" aria-labelledby="fb-depth">
            {DEPTHS.map((d) => (
              <button
                key={d.label}
                className="chip"
                aria-pressed={activeDepth === d.label}
                onClick={() => { setFilters({ minDepth: d.min, maxDepth: d.max }); applySoon(); }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {location.name && (
        <div className="ss-meta" aria-live="polite">
          Region: <strong style={{ color: 'var(--accent)' }}>{location.name.split(',').slice(0, 2).join(',')}</strong>
          {' · '}radius {location.radiusKm} km
          {' · '}<button onClick={() => { resetLocation(); setFilters({ startDate: daysAgoDateString(7), endDate: todayDateString() }); applySoon(); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600 }}>Clear region</button>
        </div>
      )}
    </div>
  );
}
