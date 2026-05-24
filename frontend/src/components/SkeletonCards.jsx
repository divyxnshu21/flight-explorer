function SkeletonCard() {
  const shimmer = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.6s linear infinite',
    borderRadius: 6,
  };
  const bar = (w, h = 12) => (
    <div style={{ ...shimmer, width: w, height: h, marginBottom: 6 }} />
  );

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 14, padding: 18,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.018), rgba(255,255,255,0.004))',
    }}>
      {/* city + flag */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <div style={{ ...shimmer, width: 36, height: 36, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          {bar('60%', 16)}
          {bar('40%', 10)}
        </div>
      </div>
      {/* price row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
        <div>{bar(80)}{bar(60, 10)}</div>
        <div style={{ textAlign: 'right' }}>{bar('90px', 24)}{bar(70, 10)}</div>
      </div>
      {/* times */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {bar(40, 18)}{bar(60, 6)}{bar(40, 18)}
      </div>
      {/* pills */}
      <div style={{ display: 'flex', gap: 6 }}>
        {bar(70, 22)}{bar(60, 22)}
      </div>
    </div>
  );
}

export default function SkeletonCards({ count = 6 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* metric skeletons */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite', borderRadius: 6, height: 10, width: '50%', marginBottom: 10 }} />
            <div style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite', borderRadius: 6, height: 28, width: '75%', marginBottom: 12 }} />
            <div style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite', borderRadius: 6, height: 10, width: '60%' }} />
          </div>
        ))}
      </div>
      {/* chart skeleton */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', height: 260, background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite', borderRadius: 6, height: 14, width: '35%', marginBottom: 8 }} />
        <div style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite', borderRadius: 6, height: 10, width: '50%' }} />
      </div>
      {/* cards */}
      <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
