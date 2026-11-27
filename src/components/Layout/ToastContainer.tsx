import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { useEarthquakeStore } from '../../store/earthquakeStore';

export default function ToastContainer() {
  const toasts = useEarthquakeStore((s) => s.toasts);
  const removeToast = useEarthquakeStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  const icons = {
    info: <Info size={14} style={{ color: 'var(--p-wave)' }} />,
    success: <CheckCircle size={14} style={{ color: 'var(--mag-2)' }} />,
    warning: <AlertTriangle size={14} style={{ color: 'var(--mag-4)' }} />,
    error: <XCircle size={14} style={{ color: 'var(--mag-6)' }} />,
  };

  const borderColors = {
    info: 'var(--p-wave)',
    success: 'var(--mag-2)',
    warning: 'var(--mag-4)',
    error: 'var(--mag-6)',
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
          className="toast panel-elevated"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            borderLeft: `4px solid ${borderColors[toast.type]}`,
            minWidth: 260, maxWidth: 380,
            pointerEvents: 'auto',
          }}
        >
          {icons[toast.type]}
          <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--quartz)', lineHeight: 1.4 }}>
            {toast.message}
          </span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mica)', display: 'flex', padding: 0 }}
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
