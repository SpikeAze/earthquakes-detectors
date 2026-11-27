import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell,
} from 'recharts';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { getMagnitudeCssVars } from '../../utils/helpers';
import { BarChart2, TrendingUp } from 'lucide-react';

export default function TrendChart() {
  const earthquakes = useEarthquakeStore((s) => s.earthquakes);

  // ── Daily frequency buckets ───────────────────────────────────────────────
  const dailyData = useMemo(() => {
    const buckets: Record<string, { date: string; count: number; maxMag: number; avgMag: number; total: number }> = {};

    earthquakes.forEach((eq) => {
      const day = new Date(eq.time).toISOString().split('T')[0];
      if (!buckets[day]) buckets[day] = { date: day, count: 0, maxMag: 0, avgMag: 0, total: 0 };
      buckets[day].count++;
      buckets[day].total += eq.magnitude;
      if (eq.magnitude > buckets[day].maxMag) buckets[day].maxMag = eq.magnitude;
    });

    return Object.values(buckets)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((b) => ({
        ...b,
        avgMag: b.total / b.count,
        dateShort: b.date.slice(5), // MM-DD
      }));
  }, [earthquakes]);

  // ── Magnitude distribution ────────────────────────────────────────────────
  const magDistribution = useMemo(() => {
    const bins: Record<string, number> = {
      '< 1': 0, '1–2': 0, '2–3': 0, '3–4': 0,
      '4–5': 0, '5–6': 0, '6–7': 0, '≥ 7': 0,
    };
    earthquakes.forEach((eq) => {
      const m = eq.magnitude;
      if (m < 1)      bins['< 1']++;
      else if (m < 2) bins['1–2']++;
      else if (m < 3) bins['2–3']++;
      else if (m < 4) bins['3–4']++;
      else if (m < 5) bins['4–5']++;
      else if (m < 6) bins['5–6']++;
      else if (m < 7) bins['6–7']++;
      else            bins['≥ 7']++;
    });
    return Object.entries(bins).map(([range, count]) => ({ range, count }));
  }, [earthquakes]);

  const tooltipStyle = {
    backgroundColor: 'var(--stratum-2)',
    border: '1px solid var(--fault-line-strong)',
    borderRadius: 'var(--radius-panel)',
    color: 'var(--quartz)',
    fontSize: 'var(--text-xs)',
    fontFamily: "'JetBrains Mono', monospace",
  };

  if (earthquakes.length === 0) {
    return (
      <div className="panel" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--mica)' }}>
        No data to display. Fetch earthquakes first.
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Daily frequency chart */}
      <div className="panel-elevated" style={{ padding: '16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <BarChart2 size={16} style={{ color:'var(--p-wave)' }} />
          <span style={{ fontWeight:600, fontSize:'var(--text-sm)', color:'var(--quartz)' }}>Daily Earthquake Count</span>
          <span style={{ marginLeft:'auto', fontSize:'var(--text-xs)', color:'var(--mica)' }}>{dailyData.length} days</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--fault-line)" />
            <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: 'var(--mica)', fontFamily: "'JetBrains Mono', monospace" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: 'var(--mica)', fontFamily: "'JetBrains Mono', monospace" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: unknown, name: string | number | undefined) => [typeof value === 'number' ? value : 0, name === 'count' ? 'Events' : String(name ?? 'Value')]} labelFormatter={(l) => `Date: ${l}`} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {dailyData.map((entry, idx) => {
                const cssVars = getMagnitudeCssVars(entry.maxMag);
                return <Cell key={idx} fill={`var(--eq-color)`} style={cssVars} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Max magnitude trend */}
      <div className="panel-elevated" style={{ padding: '16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <TrendingUp size={16} style={{ color:'var(--s-wave)' }} />
          <span style={{ fontWeight:600, fontSize:'var(--text-sm)', color:'var(--quartz)' }}>Daily Max & Avg Magnitude</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--fault-line)" />
            <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: 'var(--mica)', fontFamily: "'JetBrains Mono', monospace" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: 'var(--mica)', fontFamily: "'JetBrains Mono', monospace" }} domain={[0, 'auto']} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => (typeof v === 'number' ? v : 0).toFixed(2)} />
            <Legend wrapperStyle={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', fontFamily: "'Space Grotesk', sans-serif" }} />
            <Line type="monotone" dataKey="maxMag" stroke="var(--s-wave)" strokeWidth={2} dot={false} name="Max Mag" />
            <Line type="monotone" dataKey="avgMag" stroke="var(--p-wave)" strokeWidth={2} dot={false} name="Avg Mag" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Magnitude distribution */}
      <div className="panel-elevated" style={{ padding: '16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <BarChart2 size={16} style={{ color:'var(--surface-wave)' }} />
          <span style={{ fontWeight:600, fontSize:'var(--text-sm)', color:'var(--quartz)' }}>Magnitude Distribution</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={magDistribution} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--fault-line)" />
            <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--mica)', fontFamily: "'JetBrains Mono', monospace" }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--mica)', fontFamily: "'JetBrains Mono', monospace" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [typeof v === 'number' ? v : 0, 'Events']} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {magDistribution.map((_, idx) => {
                const mids = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5];
                const cssVars = getMagnitudeCssVars(mids[idx] ?? 0);
                return <Cell key={idx} fill={`var(--eq-color)`} style={cssVars} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {[
          ['Total Events',   earthquakes.length.toString()],
          ['Max Magnitude',  Math.max(...earthquakes.map(e => e.magnitude)).toFixed(1)],
          ['Avg Magnitude',  (earthquakes.reduce((s,e)=>s+e.magnitude,0)/earthquakes.length).toFixed(2)],
          ['With Tsunami',   earthquakes.filter(e=>e.tsunami).length.toString()],
        ].map(([label, val]) => (
          <div key={label} className="panel" style={{ padding: '14px 12px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--quartz)' }}>{val}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--mica)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
