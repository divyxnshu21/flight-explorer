import { formatINR } from '../lib/utils.js';

export default function BarChart({ results }) {
  const byCode = {};
  for (const r of results) {
    if (!byCode[r.code] || r.price < byCode[r.code].price) byCode[r.code] = r;
  }
  const sorted = Object.values(byCode).sort((a, b) => a.price - b.price);
  if (sorted.length <= 1) return null;

  const prices = sorted.map(r => r.price);
  const max    = Math.max(...prices);
  const min    = Math.min(...prices);

  const chartH  = 180;
  const minBarH = 32; // cheapest bar always at least this tall

  // Relative heights: cheapest = minBarH, most expensive = chartH.
  // This prevents hairline bars when prices have a large spread.
  const getH = (price) =>
    max === min
      ? chartH * 0.75
      : minBarH + ((price - min) / (max - min)) * (chartH - minBarH);

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px 14px',
      background: 'var(--surface-card)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Fare comparison</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 3 }}>
            Cheapest fare per destination · bar height = relative cost
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11.5, color: 'var(--text-dim)' }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(180deg, #10B981, #047857)' }} />
          Cheapest&nbsp;&nbsp;
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(180deg, #60a5fa, #2563EB)' }} />
          Others
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around',
        gap: 6, height: chartH + 52, paddingTop: 4,
      }}>
        {sorted.map(r => {
          const h      = getH(r.price);
          const isMin  = r.price === min;
          const isMax  = r.price === max;
          return (
            <div key={r.code} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end',
              height: chartH + 52, gap: 4, minWidth: 0,
            }}>
              {/* Price label above bar — "LOW" tag replaces the floating badge */}
              <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
                {isMin && (
                  <div style={{
                    fontSize: 7.5, fontWeight: 700, letterSpacing: '0.1em',
                    color: '#10B981', marginBottom: 1,
                  }}>
                    LOW
                  </div>
                )}
                <div className="mono tabnum" style={{
                  fontSize: 9,
                  color: isMin ? '#10B981' : isMax ? '#f87171' : 'var(--text-dim-2)',
                  whiteSpace: 'nowrap',
                }}>
                  ₹{formatINR(r.price)}
                </div>
              </div>

              {/* Bar */}
              <div style={{
                width: '65%', maxWidth: 48, height: h,
                borderRadius: '4px 4px 0 0',
                background: isMin
                  ? 'linear-gradient(180deg, #10B981, #047857)'
                  : 'linear-gradient(180deg, #60a5fa, #2563EB)',
                boxShadow: isMin
                  ? '0 0 24px -6px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.25)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.15)',
                flexShrink: 0,
              }} />

              {/* IATA code below bar */}
              <div className="mono" style={{
                fontSize: 10, fontWeight: 600, textAlign: 'center',
                color: isMin ? '#10B981' : 'var(--text-dim)',
              }}>
                {r.code}
              </div>

              {/* City name */}
              <div style={{
                fontSize: 9, color: 'var(--text-dim-2)', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '100%', paddingInline: 2,
              }}>
                {r.city}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
