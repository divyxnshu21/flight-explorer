import { useState, useEffect, useRef, useCallback } from 'react';
import { searchAirports } from '../lib/api.js';
import { SearchIcon, SpinnerIcon } from './Icons.jsx';

export default function AirportSearch({ value, onChange, placeholder = 'Search airports…', autoFocus = false }) {
  const [query, setQuery] = useState(value ? `${value.code} · ${value.city}` : '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const fetch_ = useCallback(async (q) => {
    if (q.length < 1) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const data = await searchAirports(q, 10);
      setResults(data);
      setOpen(data.length > 0);
      setActiveIdx(0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetch_(q), 200);
  }

  function pick(airport) {
    onChange(airport);
    setQuery(`${airport.code} · ${airport.city}`);
    setOpen(false);
    setResults([]);
  }

  function handleKey(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) { pick(results[activeIdx]); }
    if (e.key === 'Escape') { setOpen(false); }
  }

  function handleFocus() {
    if (results.length > 0) setOpen(true);
    else if (query.length > 0) fetch_(query);
  }

  function handleBlur() {
    setTimeout(() => setOpen(false), 150);
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface-field)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '9px 12px',
        transition: 'border 120ms ease',
      }}>
        {loading
          ? <SpinnerIcon size={14} color="var(--text-dim)" />
          : <SearchIcon size={14} stroke="var(--text-dim)" />}
        <input
          ref={inputRef}
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 13, fontFamily: 'Inter',
          }}
        />
      </div>

      {open && (
        <div ref={listRef} style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
          background: 'var(--surface-dropdown)',
          border: '1px solid var(--border-strong)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 16px 40px -8px rgba(0,0,0,0.3)',
          maxHeight: 280,
          overflowY: 'auto',
        }}>
          {results.map((apt, i) => (
            <div
              key={apt.code}
              onMouseDown={() => pick(apt)}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                cursor: 'pointer',
                background: i === activeIdx ? 'rgba(37,99,235,0.15)' : 'transparent',
                borderBottom: '1px solid var(--border)',
                transition: 'background 80ms ease',
              }}
            >
              <span style={{ fontSize: 18 }}>{apt.flag || '✈️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: i === activeIdx ? 'var(--accent)' : 'var(--text)' }}>{apt.code}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{apt.city}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {apt.name} · {apt.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
