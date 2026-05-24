import { SpinnerIcon } from './Icons.jsx';

export default function SuggestionChips({ chips, loading, onToggle, selected }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', fontSize: 12 }}>
        <SpinnerIcon size={13} />
        Searching…
      </div>
    );
  }
  if (!chips || chips.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: -4 }}>
      <span style={{
        fontSize: 10.5, color: 'var(--text-dim-2)', textTransform: 'uppercase',
        letterSpacing: '0.1em', alignSelf: 'center', marginRight: 4,
      }}>Matches</span>
      {chips.map(chip => {
        const sel = selected.has(chip.code);
        return (
          <button
            key={chip.code}
            onClick={() => onToggle(chip.code)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', fontSize: 11.5, fontWeight: 500, borderRadius: 999,
              border: sel ? '1px solid rgba(37,99,235,0.6)' : '1px solid var(--border)',
              background: sel ? 'rgba(37,99,235,0.6)' : 'transparent',
              color: sel ? '#fff' : 'var(--text-dim)',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 120ms ease',
            }}>
            {chip.flag && <span>{chip.flag}</span>}
            <span className="mono" style={{ fontWeight: 700, color: sel ? '#fff' : 'var(--text)' }}>{chip.code}</span>
            <span>{chip.city || chip.name}</span>
          </button>
        );
      })}
    </div>
  );
}
