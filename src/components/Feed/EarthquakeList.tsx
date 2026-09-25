import { useMemo } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import type { FeedSort } from '../../store/earthquakeStore';
import EarthquakeRow from './EarthquakeRow';
import { LoadingState, ErrorState, EmptyState } from '../States/States';

const SORTS: { key: FeedSort; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'strongest', label: 'Strongest' },
  { key: 'nearest', label: 'Nearest' },
];

export default function EarthquakeList({ compact = false }: { compact?: boolean }) {
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);
  const isLoading = useEarthquakeStore((s) => s.isLoading);
  const error = useEarthquakeStore((s) => s.error);
  const fetchData = useEarthquakeStore((s) => s.fetchData);
  const selected = useEarthquakeStore((s) => s.selectedEarthquake);
  const setSelected = useEarthquakeStore((s) => s.setSelectedEarthquake);
  const feedSort = useEarthquakeStore((s) => s.feedSort);
  const setFeedSort = useEarthquakeStore((s) => s.setFeedSort);
  const location = useEarthquakeStore((s) => s.location);

  const hasDistances = useMemo(
    () => earthquakes.some((e) => e.distanceKm !== undefined),
    [earthquakes],
  );

  const sorted = useMemo(() => {
    const arr = [...earthquakes];
    if (feedSort === 'strongest') arr.sort((a, b) => b.magnitude - a.magnitude);
    else if (feedSort === 'nearest' && hasDistances)
      arr.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    else arr.sort((a, b) => b.time - a.time);
    return arr;
  }, [earthquakes, feedSort, hasDistances]);

  const visible = compact ? sorted.slice(0, 30) : sorted;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div
        role="group"
        aria-label="Sort earthquakes"
        style={{ display: 'flex', gap: 6, padding: '12px 12px 8px', flexShrink: 0 }}
      >
        {SORTS.map((s) => {
          const disabled = s.key === 'nearest' && !hasDistances && location.latitude === null;
          return (
            <button
              key={s.key}
              className="chip"
              aria-pressed={feedSort === s.key}
              disabled={disabled}
              title={disabled ? 'Search a location to enable nearest sorting' : `Sort by ${s.label.toLowerCase()}`}
              onClick={() => setFeedSort(s.key)}
              style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
            >
              {s.label}
            </button>
          );
        })}
        <span className="ss-meta" style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          {sorted.length} events
        </span>
      </div>

      <div
        role="list"
        aria-label="Latest earthquakes"
        aria-busy={isLoading}
        style={{ flex: 1, overflowY: 'auto', padding: '0 6px 12px', minHeight: 0 }}
      >
        {isLoading && sorted.length === 0 ? (
          <LoadingState />
        ) : error && sorted.length === 0 ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : sorted.length === 0 ? (
          <EmptyState hint="Try lowering the magnitude threshold or widening the time range." />
        ) : (
          visible.map((eq) => (
            <div key={eq.id} role="listitem">
              <EarthquakeRow
                earthquake={eq}
                selected={selected?.id === eq.id}
                onSelect={setSelected}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
