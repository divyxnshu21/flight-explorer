const PLANE = "M14.64 3.66a2 2 0 0 1 2.83 2.83l-4.5 4.5 4.86 9.51-1.79 1.79-7.07-7.07-3.54 3.54.71 3.18-1.42 1.42-2.12-3.54-3.54-2.12 1.42-1.41 3.18.71 3.54-3.54L.56 6.39 2.35 4.6l9.5 4.86 4.5-4.5z";

function Mark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="mark-grad" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="34" height="34" rx="9" fill="url(#mark-grad)" />
      {/* Plane — original 24×24 path, scaled to ~18px and centred */}
      <g transform="translate(8, 8) scale(0.75)">
        <path d={PLANE} fill="white" />
      </g>
      {/* Subtle inner border */}
      <rect width="34" height="34" rx="9" stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
    </svg>
  );
}

export default function Logo({ collapsed = false }) {
  if (collapsed) {
    return <Mark size={38} />;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Mark size={32} />
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em',
        }}>
          <span style={{ color: 'var(--text)' }}>Aero</span>
          <span style={{ color: '#6366F1' }}>Scan</span>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 9, fontWeight: 500, marginTop: 4,
          color: 'var(--text-dim-2)', letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Flight Explorer
        </div>
      </div>
    </div>
  );
}
