import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useEarthquakeStore } from '../../store/earthquakeStore';

export default function ToastContainer() {
  const toasts      = useEarthquakeStore((s) => s.toasts);
  const removeToast = useEarthquakeStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  const icons = {
    info:    <Info size={14} style={{ color: '#60a5fa' }} />,
    success: <CheckCircle size={14} style={{ color: '#4ade80' }} />,
    warning: <AlertTriangle size={14} style={{ color: '#fbbf24' }} />,
    error:   <XCircle size={14} style={{ color: '#f87171' }} />,
  };

  const borders: Record<string, string> = {
    info:    'rgba(96,165,250,0.35)',
    success: 'rgba(74,222,128,0.35)',
    warning: 'rgba(251,191,36,0.35)',
    error:   'rgba(248,113,113,0.35)',
  };

  return (
    <div
      style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast glass-card"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            border: `1px solid ${borders[toast.type]}`,
            minWidth: 260, maxWidth: 380,
            pointerEvents: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {icons[toast.type]}
          <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {toast.message}
          </span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
