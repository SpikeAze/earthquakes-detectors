import type { ProcessedEarthquake } from '../../types/earthquake';
import { getMagnitudeColor, formatTimeAgo, getDepthLabel } from '../../utils/helpers';
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
  const color = getMagnitudeColor(eq.magnitude);

  return (
    <button
      className="eq-row"
      aria-current={selected ? 'true' : undefined}
      aria-label={`Magnitude ${eq.magnitude.toFixed(1)}, ${eq.place}, depth ${eq.depth.toFixed(0)} kilometers, ${formatTimeAgo(eq.time)}`}
      onClick={() => onSelect(eq)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(eq); } }}
    >
      <span
        className="mag-orb"
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${color}d9, ${color}40)`,
          border: `1.5px solid ${color}`,
          boxShadow: eq.magnitude >= 5 ? `0 0 12px ${color}44` : 'none',
        }}
      >
        {eq.magnitude.toFixed(1)}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {eq.place}
        </span>
        <span className="ss-meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
          <span>{eq.depth.toFixed(0)} km · {getDepthLabel(eq.depth)}</span>
          <span>{formatTimeAgo(eq.time)}</span>
          {eq.distanceKm !== undefined && (
            <span style={{ color: 'var(--accent)' }}>{eq.distanceKm.toFixed(0)} km away</span>
          )}
        </span>
        <span style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
          <span className={`mag-badge mag-${eq.category}`}>{eq.category} · M{eq.magnitude.toFixed(1)}</span>
          {eq.tsunami && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.66rem', fontWeight: 700, color: '#7dd3fc', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 5, padding: '1px 6px' }}>
              <Waves size={10} aria-hidden="true" /> TSUNAMI
            </span>
          )}
          {eq.felt != null && eq.felt > 0 && (
            <span className="ss-meta" style={{ border: '1px solid var(--border)', borderRadius: 5, padding: '1px 6px' }}>
              {eq.felt} felt
            </span>
          )}
        </span>
      </span>
      <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
    </button>
  );
}
