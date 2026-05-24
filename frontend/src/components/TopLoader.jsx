export default function TopLoader({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 9999, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: '30%',
        background: 'linear-gradient(90deg, transparent, #2563EB, #6366F1, transparent)',
        animation: 'loaderPulse 1.2s ease-in-out infinite',
      }} />
    </div>
  );
}
