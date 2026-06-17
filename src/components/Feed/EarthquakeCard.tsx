import type { ProcessedEarthquake } from '../../types/earthquake';
import { getMagnitudeColor } from '../../utils/helpers';
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
  const color = getMagnitudeColor(eq.magnitude);

  return (
    <button
      onClick={() => setSelected(eq)}
      className="w-full text-left transition-all duration-200"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, rgba(79,142,247,0.12), rgba(124,58,237,0.08))`
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSelected ? 'rgba(79,142,247,0.5)' : 'var(--border-glass)'}`,
        borderRadius: 10,
        padding: '10px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
      }}
    >
      {/* Rank */}
      {rank !== undefined && (
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', minWidth: 16, textAlign: 'center' }}>
          {rank}
        </div>
      )}

      {/* Magnitude circle */}
      <div
        style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}33)`,
          border: `1.5px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: eq.magnitude >= 7 ? '0.9rem' : '0.85rem',
          color: 'white',
          boxShadow: eq.magnitude >= 5 ? `0 0 10px ${color}55` : 'none',
        }}
      >
        {eq.magnitude.toFixed(1)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.82rem', fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 2,
        }}>
          {eq.place}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} /> {formatTimeAgo(eq.time)}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={10} /> {eq.depth.toFixed(1)} km · {getDepthLabel(eq.depth)}
          </span>
          {eq.distanceKm !== undefined && (
            <span style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
              {eq.distanceKm.toFixed(0)} km away
            </span>
          )}
        </div>
        {/* Tags */}
        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          <span className={`mag-badge mag-${eq.category}`}>
            {eq.category}
          </span>
          {eq.tsunami && (
            <span style={{ display:'flex', alignItems:'center', gap:2, fontSize:'0.65rem', color:'#60a5fa', background:'rgba(96,165,250,0.12)', border:'1px solid rgba(96,165,250,0.25)', borderRadius:4, padding:'1px 5px' }}>
              <Waves size={9} /> Tsunami
            </span>
          )}
          {eq.felt && eq.felt > 0 && (
            <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-glass)', borderRadius:4, padding:'1px 5px' }}>
              {eq.felt} felt
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </button>
  );
}
