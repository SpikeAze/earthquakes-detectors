import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: 'p-wave' | 's-wave' | 'surface-wave';
}

const accentMap = {
  'p-wave': 'var(--p-wave)',
  's-wave': 'var(--s-wave)',
  'surface-wave': 'var(--surface-wave)',
} as const;

export default function StatCard({ label, value, sub, icon, accent = 'p-wave' }: Props) {
  const accentColor = accentMap[accent];

  return (
    <div className="panel" style={{ minWidth: 0, padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon && (
          <span aria-hidden="true" style={{ color: accentColor, display: 'flex' }}>
            {icon}
          </span>
        )}
        <span className="uppercase-tracked">{label}</span>
      </div>
      <div className="mono" style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)', color: 'var(--quartz)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: 'var(--text-sm)', color: 'var(--mica)', lineHeight: 'var(--leading-normal)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
