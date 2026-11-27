import type { ProcessedEarthquake } from '../../types/earthquake';
import { getMagnitudeCssVars, formatTimeAgo, getDepthLabel } from '../../utils/helpers';
import { Waves, ChevronRight } from 'lucide-react';

interface Props {
  earthquake: ProcessedEarthquake;
  selected?: boolean;
  onSelect: (eq: ProcessedEarthquake) => void;
}

/**
 * Single earthquake row — magnitude is visually dominant via size + label + color.
 * Severity is also conveyed by text badge (never color-only).
 */
export default function EarthquakeRow({ earthquake: eq, selected, onSelect }: Props) {
  const cssVars = getMagnitudeCssVars(eq.magnitude);

  return (
    <button
      className="data-row"
      aria-current={selected ? 'true' : undefined}
      aria-label={`Magnitude ${eq.magnitude.toFixed(1)}, ${eq.place}, depth ${eq.depth.toFixed(0)} kilometers, ${formatTimeAgo(eq.time)}`}
      onClick={() => onSelect(eq)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(eq); } }}
      style={{ ...cssVars }}
    >
      <span
        className="mag-orb"
        aria-hidden="true"
        style={{
          width: 44, height: 44,
          background: 'var(--eq-color)',
          borderColor: 'var(--eq-color)',
          boxShadow: eq.magnitude >= 5 ? '0 0 16px var(--eq-color-44)' : 'none',
          fontSize: eq.magnitude >= 7 ? 'var(--text-base)' : 'var(--text-sm)',
        }}
      >
        {eq.magnitude.toFixed(1)}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--quartz)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {eq.place}
        </span>
        <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 3 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)' }}>{eq.depth.toFixed(0)} km · {getDepthLabel(eq.depth)}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)' }}>{formatTimeAgo(eq.time)}</span>
          {eq.distanceKm !== undefined && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--p-wave)', fontWeight: 500 }}>{eq.distanceKm.toFixed(0)} km away</span>
          )}
        </span>
        <span style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
          <span className={`mag-badge mag-${eq.category}`}>{eq.category} · M{eq.magnitude.toFixed(1)}</span>
          {eq.tsunami && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--p-wave)', background: 'var(--p-wave-dim)', border: '1px solid var(--p-wave)', borderRadius: 'var(--radius-instrument)', padding: '2px 8px' }}>
              <Waves size={10} aria-hidden="true" /> TSUNAMI
            </span>
          )}
          {eq.felt != null && eq.felt > 0 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', background: 'var(--stratum-3)', border: '1px solid var(--fault-line)', borderRadius: 'var(--radius-instrument)', padding: '2px 8px' }}>
              {eq.felt} felt
            </span>
          )}
        </span>
      </span>
      <ChevronRight size={15} style={{ color: 'var(--mica)', flexShrink: 0 }} aria-hidden="true" />
    </button>
  );
}
