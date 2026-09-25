import { Loader2, AlertTriangle, SearchX } from 'lucide-react';

export function LoadingState({ label = 'Loading earthquake data…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--text-secondary)' }}>
      <Loader2 size={22} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} aria-hidden="true" />
      <span style={{ fontSize: '0.86rem' }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 420, flexDirection: 'column' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 56 }} aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', textAlign: 'center' }}>
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={20} style={{ color: '#f87171' }} aria-hidden="true" />
      </span>
      <p style={{ margin: 0, fontWeight: 700 }}>Unable to update earthquake data</p>
      <p className="ss-meta" style={{ margin: 0, maxWidth: 420 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary" style={{ marginTop: 4 }}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'No earthquake events match the selected filters.', hint }: { title?: string; hint?: string }) {
  return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '40px 20px', textAlign: 'center' }}>
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SearchX size={20} style={{ color: 'var(--text-secondary)' }} aria-hidden="true" />
      </span>
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{title}</p>
      {hint && <p className="ss-meta" style={{ margin: 0 }}>{hint}</p>}
    </div>
  );
}
