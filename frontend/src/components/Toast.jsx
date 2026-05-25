import { useEffect } from 'react';
import { XIcon } from './Icons.jsx';

export default function Toast({ message, type = 'error', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors = {
    error:   { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.28)', text: '#f87171', dot: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.3)',  text: 'var(--warn)', dot: '#f59e0b' },
    success: { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.3)',  text: 'var(--success)', dot: '#10b981' },
  };
  const c = colors[type] || colors.error;

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
      display: 'flex', alignItems: 'flex-start', gap: 10,
      maxWidth: 420, padding: '12px 14px',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 12,
      backdropFilter: 'blur(12px)',
      boxShadow: '0 16px 40px -8px rgba(0,0,0,0.5)',
      animation: 'toastIn 220ms ease',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0, marginTop: 3 }} />
      <span style={{ fontSize: 13, color: c.text, flex: 1, lineHeight: 1.5 }}>{message}</span>
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer', color: c.text,
        padding: 0, display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        <XIcon size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
