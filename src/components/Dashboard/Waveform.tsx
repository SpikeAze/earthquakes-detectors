import { useEffect, useMemo, useRef } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { Activity } from 'lucide-react';

/**
 * Live Seismic Activity panel.
 * No public real-time waveform stream is available from the USGS event API,
 * so this component is an integration-ready placeholder: it renders an
 * illustrative trace (clearly labelled) and exposes the hook point where a
 * station WebSocket / SeedLink feed can be connected later.
 * It NEVER presents synthetic data as real readings.
 */
export default function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strongest = useEarthquakeStore((s) =>
    s.earthquakes.length ? [...s.earthquakes].sort((a, b) => b.magnitude - a.magnitude)[0] : null,
  );
  const lastUpdated = useEarthquakeStore((s) => s.lastUpdated);

  const caption = useMemo(() => {
    if (!strongest) return 'Waiting for event data — connect a station feed to render live trace.';
    return `Reference event M${strongest.magnitude.toFixed(1)} · ${strongest.place} — illustrative trace only.`;
  }, [strongest]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const draw = () => {
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      ctx.clearRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = 'rgba(148,163,184,0.12)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (h / 4) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // illustrative trace
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.6 * dpr;
      ctx.beginPath();
      const mid = h / 2;
      for (let x = 0; x < w; x += 2) {
        const p = x / dpr;
        const env = Math.exp(-Math.pow((p % 480 - 240) / 160, 2)) * (strongest ? Math.min(strongest.magnitude / 6, 1) : 0.3);
        const y = mid
          + Math.sin((p + t) * 0.09) * 4 * dpr * (0.4 + env)
          + Math.sin((p + t) * 0.023) * 10 * dpr * env
          + Math.sin(p * 0.5 + t * 0.6) * 1.5 * dpr;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      t += 2;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    if (reduced) {
      const id = setInterval(() => { t += 6; draw(); }, 1500);
      return () => { clearInterval(id); cancelAnimationFrame(raf); };
    }
    return () => cancelAnimationFrame(raf);
  }, [strongest]);

  return (
    <section id="seismic-activity" aria-labelledby="waveform-title" className="ss-card ss-card-pad" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={15} style={{ color: 'var(--accent)' }} />
        </span>
        <div>
          <h2 id="waveform-title" className="ss-h2">Live Seismic Activity</h2>
          <p className="ss-sub">Station trace hook — illustrative rendering until a live feed is connected.</p>
        </div>
        <span
          style={{ marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', borderRadius: 999, padding: '4px 10px' }}
          title="This trace is illustrative and is not a real seismometer reading"
        >
          ILLUSTRATIVE — NOT LIVE STATION DATA
        </span>
      </div>

      <div style={{ position: 'relative', marginTop: 10 }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Illustrative seismic waveform placeholder. No live station feed connected."
          style={{ width: '100%', height: 148, display: 'block', background: 'rgba(148,163,184,0.04)', border: '1px solid var(--border)', borderRadius: 10 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }} className="ss-meta ss-mono" aria-hidden="true">
          <span>−60s</span><span>−40s</span><span>−20s</span><span>now</span>
        </div>
      </div>

      <p className="ss-meta" style={{ margin: '10px 0 0' }}>
        {caption}
        {lastUpdated ? ` Last event sync ${new Date(lastUpdated).toLocaleTimeString()}.` : ''}
        {' '}To go live, connect a SeedLink / WebSocket station stream and replace the synthetic renderer in <span className="ss-mono">Waveform.tsx</span>.
      </p>
    </section>
  );
}
