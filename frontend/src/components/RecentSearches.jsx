import { ClockIcon, PlaneTiltIcon } from './Icons.jsx';

export default function RecentSearches({ searches, onRestore, onClear }) {
  if (!searches || searches.length === 0) return null;

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 12,
      background: 'var(--surface-card)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <ClockIcon size={13} stroke="var(--text-dim)" /> Recent searches
        </div>
        <button onClick={onClear} style={{ fontSize: 11, color: 'var(--text-dim-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Clear
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {searches.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px',
              borderBottom: i < searches.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer', transition: 'background 100ms ease',
            }}
            onClick={() => onRestore(s)}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-field)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <PlaneTiltIcon size={13} stroke="var(--text-dim-2)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                  {s.origin} →
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.destinations.slice(0, 5).join(', ')}{s.destinations.length > 5 ? ` +${s.destinations.length - 5}` : ''}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-dim-2)', marginTop: 2 }}>
                {s.depDate} {s.tripType === 1 ? `→ ${s.retDate}` : '· one-way'} · {s.adults} adult{s.adults > 1 ? 's' : ''} · {['', 'Economy', 'Premium', 'Business', 'First'][s.cabin]}
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim-2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {s.timeAgo}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
