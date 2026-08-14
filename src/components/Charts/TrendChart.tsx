import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, Cell,
} from 'recharts';
import { useEarthquakeStore } from '../../store/earthquakeStore';
import { getMagnitudeColor } from '../../utils/helpers';
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
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-glass-hover)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: '0.78rem',
  };

  if (earthquakes.length === 0) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-muted)', fontSize:'0.85rem' }}>
        No data to display. Fetch earthquakes first.
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Daily frequency chart */}
      <div className="glass-card-solid" style={{ padding: '16px', borderRadius: 12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <BarChart2 size={15} style={{ color:'var(--accent-blue)' }} />
          <span style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)' }}>Daily Earthquake Count</span>
          <span style={{ marginLeft:'auto', fontSize:'0.72rem', color:'var(--text-muted)' }}>{dailyData.length} days</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateShort" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={tooltipStyle}
               formatter={(value: number, name: string) => [value, name === 'count' ? 'Events' : name]}
              labelFormatter={(l) => `Date: ${l}`}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {dailyData.map((entry, idx) => (
                <Cell key={idx} fill={entry.maxMag >= 6 ? '#dc2626' : entry.maxMag >= 5 ? '#f97316' : entry.maxMag >= 4 ? '#eab308' : '#4f8ef7'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Max magnitude trend */}
      <div className="glass-card-solid" style={{ padding: '16px', borderRadius: 12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <TrendingUp size={15} style={{ color:'var(--accent-blue)' }} />
          <span style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)' }}>Daily Max & Avg Magnitude</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyData} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateShort" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 'auto']} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => Number(v).toFixed(2)} />
            <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
            <Line type="monotone" dataKey="maxMag" stroke="#ef4444" strokeWidth={2} dot={false} name="Max Mag" />
            <Line type="monotone" dataKey="avgMag" stroke="#4f8ef7" strokeWidth={2} dot={false} name="Avg Mag" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Magnitude distribution */}
      <div className="glass-card-solid" style={{ padding: '16px', borderRadius: 12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <BarChart2 size={15} style={{ color:'var(--accent-blue)' }} />
          <span style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--text-primary)' }}>Magnitude Distribution</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={magDistribution} margin={{ top: 4, right: 4, left: -10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Events']} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {magDistribution.map((_, idx) => {
                const mids = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5];
                return <Cell key={idx} fill={getMagnitudeColor(mids[idx] ?? 0)} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
        {[
          ['Total Events',   earthquakes.length.toString()],
          ['Max Magnitude',  Math.max(...earthquakes.map(e => e.magnitude)).toFixed(1)],
          ['Avg Magnitude',  (earthquakes.reduce((s,e)=>s+e.magnitude,0)/earthquakes.length).toFixed(2)],
          ['With Tsunami',   earthquakes.filter(e=>e.tsunami).length.toString()],
        ].map(([label, val]) => (
          <div key={label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-glass)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
            <div style={{ fontFamily:"'JetBrains Mono', monospace", fontWeight:700, fontSize:'1.1rem', color:'var(--text-primary)' }}>{val}</div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:3 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
