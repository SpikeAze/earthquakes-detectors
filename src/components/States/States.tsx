import { Loader2, AlertTriangle, SearchX } from 'lucide-react';

export function LoadingState({ label = 'Loading earthquake data…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px', color: 'var(--feldspar)' }}>
      <Loader2 size={24} style={{ color: 'var(--p-wave)', animation: 'spin 1s linear infinite' }} aria-hidden="true" />
      <span style={{ fontSize: 'var(--text-sm)' }}>{label}</span>
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
    <div role="alert" className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 24px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(192, 57, 43, 0.15)', border: '1px solid rgba(192, 57, 43, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertTriangle size={20} style={{ color: 'var(--mag-6)' }} aria-hidden="true" />
      </span>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--quartz)' }}>Unable to update earthquake data</p>
      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--mica)', maxWidth: 360 }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary" style={{ marginTop: 4 }}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'No earthquake events match the selected filters.', hint }: { title?: string; hint?: string }) {
  return (
    <div role="status" className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 24px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--stratum-3)', border: '1px solid var(--fault-line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <SearchX size={20} style={{ color: 'var(--mica)' }} aria-hidden="true" />
      </span>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--quartz)' }}>{title}</p>
      {hint && <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--mica)' }}>{hint}</p>}
    </div>
  );
}
