import { useEffect } from 'react';
import { XIcon } from './Icons.jsx';

const SHORTCUTS = [
  { keys: ['⌘', 'K'],   desc: 'Focus search bar' },
  { keys: ['⌘', '↵'],   desc: 'Run flight search' },
  { keys: ['?'],         desc: 'Toggle this help' },
  { keys: ['Esc'],       desc: 'Close dropdowns / help' },
  { keys: ['⌘', '\\'],  desc: 'Toggle sidebar' },
];

export default function KeyboardHelp({ onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'toastIn 180ms ease',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 999,
        transform: 'translate(-50%, -50%)',
        background: '#0f1828',
        border: '1px solid var(--border-strong)',
        borderRadius: 16, padding: '24px 28px',
        width: 340,
        boxShadow: '0 40px 80px -20px rgba(0,0,0,0.7)',
        animation: 'toastIn 200ms ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Keyboard shortcuts</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4 }}>
            <XIcon size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SHORTCUTS.map(({ keys, desc }, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{desc}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {keys.map((k, j) => (
                  <kbd key={j} style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 6, padding: '3px 8px',
                    fontSize: 11, color: 'var(--text)', fontWeight: 600,
                    boxShadow: '0 2px 0 rgba(0,0,0,0.3)',
                  }}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim-2)', textAlign: 'center' }}>
          Press <kbd style={{ fontFamily: 'JetBrains Mono', fontSize: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>?</kbd> anytime to open this
        </div>
      </div>
    </>
  );
}
