import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: string;
}

export default function StatCard({ label, value, sub, icon, accent }: Props) {
  return (
    <div
      className="ss-card ss-card-pad"
      style={{ minWidth: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon && (
          <span aria-hidden="true" style={{ color: accent ?? 'var(--accent)', display: 'flex' }}>
            {icon}
          </span>
        )}
        <span className="ss-section-label">{label}</span>
      </div>
      <div className="ss-mono stat-value">
        {value}
      </div>
      {sub && (
        <div className="ss-meta" style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
