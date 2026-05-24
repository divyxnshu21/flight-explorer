import { formatINR } from '../lib/utils.js';

export default function BarChart({ results }) {
  // Dedupe: one (cheapest) entry per destination code
  const byCode = {};
  for (const r of results) {
    if (!byCode[r.code] || r.price < byCode[r.code].price) byCode[r.code] = r;
  }
  const sorted = Object.values(byCode).sort((a, b) => a.price - b.price);
  if (sorted.length === 0) return null;

  const max = Math.max(...sorted.map(r => r.price));
  const min = Math.min(...sorted.map(r => r.price));
  const steps = 5;
  const niceMax = Math.ceil(max / 10000) * 10000;
  const gridLines = Array.from({ length: steps + 1 }, (_, i) => Math.round(niceMax * (steps - i) / steps));
  const chartH = 180;
  const labelGutter = 52;

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px 14px',
      background: 'rgba(255,255,255,0.015)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Fare distribution by destination</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 3 }}>
            Cheapest fare per route · sorted cheapest → highest
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11.5, color: 'var(--text-dim)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(180deg, #3b82f6, #2563EB)' }} />
          Base fare (₹)
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, height: chartH + 32, position: 'relative' }}>
        {/* Y axis */}
        <div style={{ width: labelGutter, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: 32 }} className="mono tabnum">
          {gridLines.map((v, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--text-dim-2)', textAlign: 'right', paddingRight: 8 }}>
              ₹{v >= 1000 ? Math.round(v / 1000) + 'k' : v}
            </div>
          ))}
        </div>

        {/* Bars */}
        <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--border)' }}>
          {gridLines.map((_, i) => (
            <div key={i} style={{
              position: 'absolute', top: (i / steps) * chartH, left: 0, right: 0, height: 1,
              borderTop: i === steps ? '1px solid var(--border-strong)' : '1px dashed rgba(255,255,255,0.05)',
            }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: chartH, paddingTop: 4 }}>
            {sorted.map(r => {
              const h = Math.max(4, (r.price / niceMax) * chartH);
              const isMin = r.price === min;
              return (
                <div key={r.code} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: chartH, justifyContent: 'flex-end', paddingInline: 4 }}>
                  <div className="mono tabnum" style={{ fontSize: 9, color: isMin ? '#10B981' : 'var(--text-dim-2)' }}>
                    ₹{formatINR(r.price)}
                  </div>
                  <div style={{
                    width: '70%', maxWidth: 40, height: h,
                    borderRadius: '4px 4px 0 0',
                    background: isMin ? 'linear-gradient(180deg, #10B981, #047857)' : 'linear-gradient(180deg, #60a5fa, #2563EB)',
                    boxShadow: isMin ? '0 0 24px -6px rgba(16,185,129,0.6), inset 0 1px 0 rgba(255,255,255,0.25)' : 'inset 0 1px 0 rgba(255,255,255,0.18)',
                    position: 'relative',
                  }}>
                    {isMin && (
                      <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#10B981', whiteSpace: 'nowrap', fontWeight: 600, letterSpacing: '0.08em' }}>LOW</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* X labels */}
          <div style={{ position: 'absolute', top: chartH + 4, left: 0, right: 0, display: 'flex', justifyContent: 'space-around' }}>
            {sorted.map(r => (
              <div key={r.code} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600, color: r.price === min ? '#10B981' : 'var(--text-dim)' }} className="mono">
                {r.code}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
