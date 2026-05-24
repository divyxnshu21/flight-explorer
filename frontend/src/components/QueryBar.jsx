import { useState, useRef, useCallback, useEffect } from 'react';
import { XIcon, PlusIcon, SpinnerIcon, SearchIcon } from './Icons.jsx';
import { searchAirports } from '../lib/api.js';

export default function QueryBar({ selected, onRemove, onClear, onAdd }) {
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (addOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [addOpen]);

  const doSearch = useCallback(async (q) => {
    if (q.length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await searchAirports(q, 8);
      setResults(data);
      setActiveIdx(0);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  function handleInput(e) {
    const q = e.target.value;
    setAddQuery(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(q), 200);
  }

  function pick(apt) {
    onAdd(apt.code);
    setAddQuery('');
    setResults([]);
    setAddOpen(false);
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) pick(results[activeIdx]);
    if (e.key === 'Escape') { setAddOpen(false); setAddQuery(''); setResults([]); }
  }

  const codes = [...selected];

  if (codes.length === 0 && !addOpen) {
    return (
      <div style={{
        border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px',
        background: 'rgba(17,24,39,0.6)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ display: 'inline-flex', width: 6, height: 6, borderRadius: '50%', background: 'var(--text-dim-2)', flexShrink: 0 }} />
        <span style={{ color: 'var(--text-dim)', fontSize: 12.5 }}>
          No destinations selected — pick airports above or
        </span>
        <button onClick={() => setAddOpen(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
          color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
        }}>
          <PlusIcon size={12} /> add airport
        </button>
      </div>
    );
  }

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px',
      background: 'rgba(17,24,39,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      position: 'relative',
    }}>
      {codes.length > 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginRight: 4 }}>
          Querying
        </span>
      )}

      {codes.map(code => (
        <span key={code} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 4px 5px 10px', borderRadius: 999,
          background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.4)',
          color: '#dbe5ff', fontSize: 12, fontWeight: 500,
        }}>
          <span className="mono" style={{ fontWeight: 600 }}>{code}</span>
          <button
            onClick={() => onRemove(code)}
            style={{
              width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
              display: 'grid', placeItems: 'center', cursor: 'pointer', border: 'none', color: '#fff',
            }}>
            <XIcon size={10} stroke="#fff" strokeWidth={2.2} />
          </button>
        </span>
      ))}

      {/* Add airport inline */}
      {addOpen ? (
        <div style={{ position: 'relative', flex: '0 0 220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 999, padding: '4px 10px' }}>
            {loading ? <SpinnerIcon size={12} /> : <SearchIcon size={12} stroke="var(--text-dim)" />}
            <input
              ref={inputRef}
              value={addQuery}
              onChange={handleInput}
              onKeyDown={handleKey}
              onBlur={() => setTimeout(() => { setAddOpen(false); setAddQuery(''); setResults([]); }, 150)}
              placeholder="Search airport…"
              style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 12, fontFamily: 'Inter', width: 160 }}
            />
          </div>
          {results.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
              background: '#0f1828', border: '1px solid var(--border-strong)',
              borderRadius: 10, overflow: 'hidden',
              boxShadow: '0 -12px 40px -8px rgba(0,0,0,0.6)', zIndex: 999, maxHeight: 240, overflowY: 'auto',
            }}>
              {results.map((apt, i) => (
                <div key={apt.code} onMouseDown={() => pick(apt)} onMouseEnter={() => setActiveIdx(i)}
                  style={{
                    display: 'flex', gap: 10, padding: '9px 12px', cursor: 'pointer',
                    background: i === activeIdx ? 'rgba(37,99,235,0.15)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                  }}>
                  <span style={{ fontSize: 16 }}>{apt.flag || '✈️'}</span>
                  <div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: i === activeIdx ? '#60a5fa' : 'var(--text)' }}>{apt.code}</span>
                      <span style={{ fontSize: 12, color: 'var(--text)' }}>{apt.city}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{apt.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button onClick={() => setAddOpen(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
          color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)',
          border: '1px dashed var(--border)', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <PlusIcon size={11} /> Add airport
        </button>
      )}

      {codes.length > 0 && (
        <button onClick={onClear} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          Clear all
        </button>
      )}
    </div>
  );
}
