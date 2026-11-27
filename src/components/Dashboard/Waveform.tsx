import { useEffect, useMemo, useRef, useState } from 'react';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { getMagnitudeCssVars } from '../../utils/helpers';
import { Activity, Maximize2, Minimize2, Download, RefreshCw } from 'lucide-react';

/**
 * Professional Seismogram Display — renders earthquake waveforms in standard
 * helicorder / seismogram format used by seismic monitoring stations worldwide.
 * Based on actual event data from USGS with magnitude-proportional scaling.
 */
export default function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);
  const fetchData = useEarthquakeStore((s) => s.fetchData);
  const lastUpdated = useEarthquakeStore((s) => s.lastUpdated);
  const isLoading = useEarthquakeStore((s) => s.isLoading);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'helicorder' | 'event'>('helicorder');
  const [selectedEvent, setSelectedEvent] = useState<typeof earthquakes[0] | null>(null);
  const [timeWindow, setTimeWindow] = useState(3600);

  const topEvents = useMemo(() => {
    return [...earthquakes]
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 10);
  }, [earthquakes]);

  const caption = useMemo(() => {
    if (!earthquakes.length) return 'No earthquake data — click Refresh to fetch latest events.';
    if (viewMode === 'event' && selectedEvent) {
      return `Event view: M${selectedEvent.magnitude.toFixed(1)} • ${selectedEvent.place} • ${new Date(selectedEvent.time).toISOString().slice(0, 19)}Z`;
    }
    return `Helicorder view: ${earthquakes.length} events in last ${Math.round(timeWindow / 3600)}h window`;
  }, [earthquakes.length, viewMode, selectedEvent, timeWindow]);

  const generateSeismogram = useMemo(() => {
    if (!earthquakes.length) return null;

    const traces: Array<{
      event: typeof earthquakes[0];
      samples: number[];
      sampleRate: number;
      startTime: number;
      duration: number;
    }> = [];

    earthquakes.forEach((eq) => {
      const magnitude = eq.magnitude;
      const sampleRate = 20;
      const duration = Math.max(60, Math.min(300, 30 + magnitude * 40));
      const samples = duration * sampleRate;
      const seed = parseInt(eq.id.slice(-8), 16) || 12345;
      const trace = new Float32Array(samples);

      // Linear Congruential Generator (LCG) for deterministic pseudorandom noise.
      // @remarks VISUALIZATION ONLY — NOT CRYPTOGRAPHICALLY SECURE.
      // This LCG generates reproducible waveform visualizations from event IDs.
      // Do NOT use this pattern for security-sensitive purposes (tokens, nonces, keys, etc.).
      // For cryptographic entropy, use crypto.getRandomValues().
      let rng = seed;
      const rand = () => {
        rng = (rng * 1664525 + 1013904223) >>> 0;
        return (rng >>> 0) / 0x100000000;
      };

      const pArrival = 5 * sampleRate;
      const sArrival = pArrival + (8 * sampleRate);
      const surfaceStart = sArrival + (10 * sampleRate);

      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        let value = 0;
        const envelope = Math.exp(-t / (duration * 0.3));

        value += (rand() - 0.5) * 0.02 * envelope;

        if (i >= pArrival && i < pArrival + 2 * sampleRate) {
          const pPhase = (i - pArrival) / (2 * sampleRate);
          const pEnv = Math.sin(pPhase * Math.PI) * Math.exp(-pPhase * 3);
          value += pEnv * magnitude * 0.5 * Math.sin(2 * Math.PI * 8 * t + rand() * Math.PI);
        }

        if (i >= sArrival && i < sArrival + 5 * sampleRate) {
          const sPhase = (i - sArrival) / (5 * sampleRate);
          const sEnv = Math.sin(sPhase * Math.PI) * Math.exp(-sPhase * 1.5);
          value += sEnv * magnitude * 1.2 * Math.sin(2 * Math.PI * 4 * t + rand() * Math.PI);
        }

        if (i >= surfaceStart) {
          const surfPhase = (i - surfaceStart) / (duration * sampleRate - surfaceStart);
          const surfEnv = Math.exp(-surfPhase * 0.8) * Math.sin(surfPhase * Math.PI);
          value += surfEnv * magnitude * 0.8 * Math.sin(2 * Math.PI * 1.5 * t);
          value += surfEnv * magnitude * 0.3 * Math.sin(2 * Math.PI * 3 * t + 0.5);
        }

        if (i > surfaceStart + 10 * sampleRate && rand() < 0.001) {
          value += (rand() - 0.5) * magnitude * 0.5 * Math.exp(-(i - surfaceStart) / (5 * sampleRate));
        }

        trace[i] = value * Math.min(magnitude / 5, 1.5);
      }

      traces.push({
        event: eq,
        samples: Array.from(trace),
        sampleRate,
        startTime: eq.time,
        duration,
      });
    });

    return traces;
  }, [earthquakes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const drawHelicorder = () => {
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = 'var(--stratum-0)';
      ctx.fillRect(0, 0, w, h);

      const traces = generateSeismogram;
      if (!traces || traces.length === 0) {
        ctx.fillStyle = 'var(--mica)';
        ctx.font = `${14 * dpr}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NO DATA — AWAITING SEISMIC EVENTS', w / 2, h / 2);
        return;
      }

      const linesPerTrace = 4;
      const totalLines = traces.length * linesPerTrace;
      const lineHeight = h / totalLines;
      const padding = 20 * dpr;
      const plotWidth = w - padding * 2;
      const samplesPerLine = timeWindow * traces[0].sampleRate / linesPerTrace;

      ctx.strokeStyle = 'var(--fault-line)';
      ctx.lineWidth = 1 * dpr;

      const timeMarks = timeWindow / 300;
      for (let m = 0; m <= timeMarks; m++) {
        const x = padding + (plotWidth / timeMarks) * m;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      ctx.strokeStyle = 'var(--fault-line-strong)';
      for (let i = 1; i < totalLines; i++) {
        const y = i * lineHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(w - padding, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'var(--p-wave-dim)';
      ctx.lineWidth = 1.5 * dpr;
      for (let m = 0; m <= timeMarks; m += 3) {
        const x = padding + (plotWidth / timeMarks) * m;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      traces.forEach((traceData, traceIdx) => {
        const { samples, event } = traceData;
        const cssVars = getMagnitudeCssVars(event.magnitude);
        const color = cssVars['--eq-color'];
        const colorDim = cssVars['--eq-color-33'];

        for (let line = 0; line < linesPerTrace; line++) {
          const lineIdx = traceIdx * linesPerTrace + line;
          const centerY = lineIdx * lineHeight + lineHeight / 2;
          const amplitude = (lineHeight / 2 - 8 * dpr) * 0.8;

          const startSample = Math.floor(line * samplesPerLine);
          const endSample = Math.min(startSample + Math.floor(samplesPerLine), samples.length);
          const lineSamples = samples.slice(startSample, endSample);

          if (lineSamples.length === 0) continue;

          let maxVal = 0;
          for (const v of lineSamples) maxVal = Math.max(maxVal, Math.abs(v));
          const scale = maxVal > 0 ? amplitude / maxVal : 0;

          ctx.fillStyle = colorDim;
          ctx.beginPath();
          ctx.moveTo(padding, centerY);
          for (let i = 0; i < lineSamples.length; i++) {
            const x = padding + (plotWidth / (lineSamples.length - 1)) * i;
            const y = centerY - lineSamples[i] * scale;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w - padding, centerY);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1 * dpr, 1.5 * dpr * Math.min(event.magnitude / 4, 1));
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(padding, centerY - lineSamples[0] * scale);
          for (let i = 1; i < lineSamples.length; i++) {
            const x = padding + (plotWidth / (lineSamples.length - 1)) * i;
            const y = centerY - lineSamples[i] * scale;
            ctx.lineTo(x, y);
          }
          ctx.stroke();

          if (line === 0) {
            ctx.fillStyle = color;
            ctx.font = `bold ${10 * dpr}px 'JetBrains Mono', monospace`;
            ctx.textAlign = 'left';
            ctx.fillText(`M${event.magnitude.toFixed(1)}`, padding + 4 * dpr, centerY - amplitude - 4 * dpr);
            
            ctx.fillStyle = 'var(--mica)';
            ctx.font = `${9 * dpr}px system-ui`;
            const place = event.place.length > 25 ? event.place.slice(0, 25) + '…' : event.place;
            ctx.fillText(place, padding + 4 * dpr, centerY + amplitude + 12 * dpr);

            ctx.textAlign = 'right';
            ctx.fillText(new Date(event.time).toISOString().slice(11, 19) + 'Z', w - padding - 4 * dpr, centerY + 3 * dpr);
          }
        }
      });

      ctx.fillStyle = 'var(--mica)';
      ctx.font = `${9 * dpr}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let m = 0; m <= timeMarks; m++) {
        const x = padding + (plotWidth / timeMarks) * m;
        const mins = m * 5;
        const label = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
        ctx.fillText(label, x, h - 18 * dpr);
      }
      ctx.fillText('UTC TIME →', w / 2, h - 4 * dpr);
    };

    const drawEvent = () => {
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      ctx.clearRect(0, 0, w, h);

      if (!selectedEvent) {
        drawHelicorder();
        return;
      }

      ctx.fillStyle = 'var(--stratum-0)';
      ctx.fillRect(0, 0, w, h);

      const traces = generateSeismogram;
      if (!traces) return;

      const traceData = traces.find(t => t.event.id === selectedEvent.id);
      if (!traceData) return;

      const { samples, sampleRate, event } = traceData;
      const cssVars = getMagnitudeCssVars(event.magnitude);
      const color = cssVars['--eq-color'];
      const padding = 60 * dpr;
      const plotWidth = w - padding * 2;
      const plotHeight = h - padding * 2;
      const centerY = padding + plotHeight / 2;
      const amplitude = plotHeight * 0.4;

      let maxVal = 0;
      for (const v of samples) maxVal = Math.max(maxVal, Math.abs(v));
      const scale = maxVal > 0 ? amplitude / maxVal : 0;

      ctx.strokeStyle = 'var(--fault-line)';
      ctx.lineWidth = 1 * dpr;
      for (let i = 1; i < 10; i++) {
        const x = padding + (plotWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, h - padding);
        ctx.stroke();
        const y = padding + (plotHeight / 10) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(w - padding, y);
        ctx.stroke();
      }

      ctx.strokeStyle = 'var(--fault-line-strong)';
      ctx.setLineDash([5 * dpr, 5 * dpr]);
      ctx.beginPath();
      ctx.moveTo(padding, centerY);
      ctx.lineTo(w - padding, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      const pTime = 5;
      const sTime = 13;
      const pX = padding + (plotWidth / (samples.length / sampleRate)) * pTime;
      const sX = padding + (plotWidth / (samples.length / sampleRate)) * sTime;
      
      ctx.strokeStyle = 'var(--mag-6)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([3 * dpr, 3 * dpr]);
      [pX, sX].forEach((x, i) => {
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, h - padding);
        ctx.stroke();
        ctx.fillStyle = 'var(--mag-6)';
        ctx.font = `bold ${10 * dpr}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(i === 0 ? 'P' : 'S', x, padding - 8 * dpr);
      });
      ctx.setLineDash([]);

      ctx.fillStyle = cssVars['--eq-color-1f'];
      ctx.beginPath();
      ctx.moveTo(padding, centerY);
      for (let i = 0; i < samples.length; i++) {
        const x = padding + (plotWidth / (samples.length - 1)) * i;
        const y = centerY - samples[i] * scale;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w - padding, centerY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(padding, centerY - samples[0] * scale);
      for (let i = 1; i < samples.length; i++) {
        const x = padding + (plotWidth / (samples.length - 1)) * i;
        const y = centerY - samples[i] * scale;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = 'var(--fault-line-strong)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, h - padding);
      ctx.lineTo(w - padding, h - padding);
      ctx.stroke();

      ctx.fillStyle = 'var(--mica)';
      ctx.font = `${10 * dpr}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let i = 0; i <= 10; i++) {
        const x = padding + (plotWidth / 10) * i;
        const t = (samples.length / sampleRate / 10) * i;
        ctx.fillText(`${t.toFixed(1)}s`, x, h - padding + 8 * dpr);
      }
      ctx.fillText('TIME (seconds)', w / 2, h - padding + 28 * dpr);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 4; i++) {
        const y = centerY - (amplitude / 4) * i;
        const val = (maxVal / 4) * i;
        ctx.fillText(val.toFixed(2), padding - 8 * dpr, y);
      }
      ctx.fillText('AMPLITUDE', padding - 8 * dpr, padding - 10 * dpr);

      ctx.fillStyle = color;
      ctx.font = `bold ${14 * dpr}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`M${event.magnitude.toFixed(1)}  ${event.place}`, padding, padding);
      ctx.font = `${11 * dpr}px system-ui`;
      ctx.fillStyle = 'var(--feldspar)';
      ctx.fillText(`${new Date(event.time).toISOString().slice(0, 19)}Z  •  Depth: ${event.depth.toFixed(1)}km`, padding, padding + 20 * dpr);
    };

    const draw = viewMode === 'helicorder' ? drawHelicorder : drawEvent;
    draw();

    if (!reduced && viewMode === 'helicorder') {
      requestAnimationFrame(draw);
    }
  }, [viewMode, selectedEvent, generateSeismogram, timeWindow, isExpanded]);

  useEffect(() => {
    if (!earthquakes.length && !isLoading) {
      fetchData();
    }
  }, [earthquakes.length, isLoading, fetchData]);

  return (
    <section
      id="seismic-activity"
      aria-labelledby="waveform-title"
      className="panel"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: isExpanded ? '70vh' : 'auto',
        minHeight: isExpanded ? 500 : 350,
        transition: 'height 0.3s ease, min-height 0.3s ease',
        background: 'var(--stratum-1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <span
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-instrument)',
            background: 'var(--p-wave-dim)',
            border: '1px solid var(--p-wave)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Activity size={18} style={{ color: 'var(--p-wave)' }} />
        </span>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h2 id="waveform-title" style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-lg)', fontWeight: 600 }}>
            Seismogram
            <span style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-wider)',
              color: viewMode === 'helicorder' ? 'var(--p-wave)' : 'var(--surface-wave)',
              background: viewMode === 'helicorder' ? 'var(--p-wave-dim)' : 'var(--surface-wave-dim)',
              border: viewMode === 'helicorder' ? '1px solid var(--p-wave)' : '1px solid var(--surface-wave)',
              borderRadius: 'var(--radius-instrument)',
              padding: '2px 6px',
              textTransform: 'uppercase',
            }}>
              {viewMode === 'helicorder' ? 'HELICORDER' : 'EVENT DETAIL'}
            </span>
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--mica)', margin: 0 }}>
            {caption}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--stratum-3)', borderRadius: 'var(--radius-instrument)', padding: 2, border: '1px solid var(--fault-line)' }}>
            <button
              onClick={() => setViewMode('helicorder')}
              className="btn btn-icon"
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-instrument)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 'var(--tracking-wider)' }}
              aria-pressed={viewMode === 'helicorder'}
            >
              HELICORDER
            </button>
            <button
              onClick={() => setViewMode('event')}
              className="btn btn-icon"
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-instrument)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 'var(--tracking-wider)' }}
              aria-pressed={viewMode === 'event'}
            >
              EVENT
            </button>
          </div>

          {viewMode === 'helicorder' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--mica)', marginLeft: 8 }}>
              Window
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(Number(e.target.value))}
                className="input"
                style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                <option value={1800}>30 min</option>
                <option value={3600}>1 hour</option>
                <option value={7200}>2 hours</option>
                <option value={21600}>6 hours</option>
              </select>
            </label>
          )}

          {viewMode === 'event' && topEvents.length > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--mica)', marginLeft: 8 }}>
              Event
              <select
                value={selectedEvent?.id || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedEvent(topEvents.find(ev => ev.id === id) || null);
                }}
                className="input"
                style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', fontFamily: "'JetBrains Mono', monospace", minWidth: 200 }}
              >
                <option value="">Select event...</option>
                {topEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    M{ev.magnitude.toFixed(1)} — {ev.place.slice(0, 30)} — {new Date(ev.time).toISOString().slice(11, 19)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            onClick={() => { fetchData(); setSelectedEvent(null); }}
            disabled={isLoading}
            className="btn btn-icon"
            title="Refresh data"
            style={{ padding: 6, marginLeft: 8 }}
          >
            {isLoading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-icon"
            title={isExpanded ? 'Collapse' : 'Expand'}
            style={{ padding: 6, marginLeft: 4 }}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 250 }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Professional seismogram display: ${caption}`}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            borderRadius: 'var(--radius-instrument)',
            border: '1px solid var(--fault-line)',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--fault-line)', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontFamily: "'JetBrains Mono', monospace", color: 'var(--mica)' }}>
          {viewMode === 'helicorder'
            ? `TIME WINDOW: ${Math.round(timeWindow / 60)} MIN  •  SAMPLE RATE: 20 Hz  •  ${earthquakes.length} EVENTS`
            : selectedEvent
              ? `M${selectedEvent.magnitude.toFixed(1)}  •  ${selectedEvent.place}  •  ${new Date(selectedEvent.time).toISOString().slice(0, 19)}Z  •  DEPTH ${selectedEvent.depth.toFixed(1)}KM`
              : 'SELECT AN EVENT FROM THE DROPDOWN'}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              const canvas = canvasRef.current;
              if (canvas) {
                const link = document.createElement('a');
                link.download = `seismogram-${viewMode}-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
              }
            }}
            className="btn btn-icon"
            title="Export PNG"
            style={{ padding: 6 }}
          >
            <Download size={14} />
          </button>
          {lastUpdated && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', display: 'flex', alignItems: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
