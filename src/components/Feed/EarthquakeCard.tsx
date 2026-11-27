import type { ProcessedEarthquake } from '../../types/earthquake';
import { getMagnitudeCssVars } from '../../utils/helpers';
import { formatTimeAgo, getDepthLabel } from '../../utils/helpers';
import { Waves, Clock, MapPin, ChevronRight } from 'lucide-react';
import { useEarthquakeStore } from '../../store/earthquakeStore';

interface Props {
  earthquake: ProcessedEarthquake;
  rank?: number;
}

export default function EarthquakeCard({ earthquake: eq, rank }: Props) {
  const setSelected = useEarthquakeStore((s) => s.setSelectedEarthquake);
  const selected = useEarthquakeStore((s) => s.selectedEarthquake);
  const isSelected = selected?.id === eq.id;
  const cssVars = getMagnitudeCssVars(eq.magnitude);

  return (
    <button
      onClick={() => setSelected(eq)}
      className="w-full text-left"
      style={{
        background: isSelected ? 'var(--p-wave-dim)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid var(--fault-line)',
        borderRadius: 0,
        padding: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        ...cssVars,
      }}
    >
      {/* Rank */}
      {rank !== undefined && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', minWidth: 20, textAlign: 'center' }}>
          {rank}
        </div>
      )}

      {/* Magnitude orb */}
      <div
        className="mag-orb"
        style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: 'var(--eq-color)',
          borderColor: 'var(--eq-color)',
          fontSize: eq.magnitude >= 7 ? 'var(--text-base)' : 'var(--text-sm)',
          ...cssVars,
        }}
      >
        {eq.magnitude.toFixed(1)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--text-sm)', fontWeight: 600,
          color: 'var(--quartz)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 4,
        }}>
          {eq.place}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> {formatTimeAgo(eq.time)}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} /> {eq.depth.toFixed(1)} km · {getDepthLabel(eq.depth)}
          </span>
          {eq.distanceKm !== undefined && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--p-wave)', fontWeight: 500 }}>
              {eq.distanceKm.toFixed(0)} km away
            </span>
          )}
        </div>
        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          <span className={`mag-badge mag-${eq.category}`}>
            {eq.category}
          </span>
          {eq.tsunami && (
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'var(--text-xs)', color:'var(--p-wave)', background:'var(--p-wave-dim)', border:'1px solid var(--p-wave)', borderRadius:'var(--radius-instrument)', padding:'2px 8px' }}>
              <Waves size={10} /> Tsunami
            </span>
          )}
          {eq.felt && eq.felt > 0 && (
            <span style={{ fontSize:'var(--text-xs)', color:'var(--mica)', background:'var(--stratum-3)', border:'1px solid var(--fault-line)', borderRadius:'var(--radius-instrument)', padding:'2px 8px' }}>
              {eq.felt} felt
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={14} style={{ color: 'var(--mica)', flexShrink: 0 }} />
    </button>
  );
}
