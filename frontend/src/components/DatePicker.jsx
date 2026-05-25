import { useState, useEffect } from 'react';
import { ChevronDown } from './Icons.jsx';

const MONTHS_LONG  = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['S','M','T','W','T','F','S'];

// How many years to show at once in year-grid mode
const YEAR_PAGE = 12;

export default function DatePicker({ value, onChange, min, autoOpenSignal = 0, attention = false }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const minStr   = min || todayStr;

  const [open,      setOpen]      = useState(false);
  const [mode,      setMode]      = useState('day');   // 'day' | 'month' | 'year'
  const [viewYear,  setViewYear]  = useState(() => Number((value || todayStr).slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number((value || todayStr).slice(5, 7)) - 1);
  const [yearStart, setYearStart] = useState(() => {
    const y = Number((value || todayStr).slice(0, 4));
    return y - (y % YEAR_PAGE);
  });

  useEffect(() => {
    const src = value || todayStr;
    const y = Number(src.slice(0, 4));
    const m = Number(src.slice(5, 7)) - 1;
    setViewYear(y);
    setViewMonth(m);
    setYearStart(y - (y % YEAR_PAGE));
  }, [value]);

  useEffect(() => {
    if (!autoOpenSignal) return;
    setOpen(true);
    setMode('day');
  }, [autoOpenSignal]);

  function pick(day) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
    setMode('day');
  }

  function pickMonth(m) {
    setViewMonth(m);
    setMode('day');
  }

  function pickYear(y) {
    setViewYear(y);
    setMode('month');
  }

  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  const displayDate = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Select date';

  const btnStyle = (active) => ({
    background: active ? 'linear-gradient(135deg, #2563EB, #6366F1)' : 'transparent',
    color: active ? '#fff' : 'var(--text)',
    border: 'none', borderRadius: 7, cursor: 'pointer',
    fontFamily: 'inherit', fontSize: 12, fontWeight: active ? 700 : 400,
    transition: 'background 80ms ease',
    display: 'grid', placeItems: 'center',
  });

  const navBtn = {
    width: 24, height: 24, borderRadius: 6,
    border: '1px solid var(--border)', background: 'var(--surface-hover)',
    color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14,
    display: 'grid', placeItems: 'center', fontFamily: 'inherit', flexShrink: 0,
  };

  return (
    <div>
      {/* Trigger */}
      <div
        onClick={() => { setOpen(o => !o); setMode('day'); }}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          paddingBottom: attention ? 5 : 0,
        }}>
        {attention && (
          <span style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            borderRadius: 999,
            background: 'linear-gradient(90deg, #F59E0B, rgba(245,158,11,0.15))',
            boxShadow: '0 0 12px rgba(245,158,11,0.35)',
          }} />
        )}
        <span style={{ fontSize: 13, fontWeight: 500, color: value ? 'var(--text)' : 'var(--text-dim)' }}>
          {displayDate}
        </span>
        <span style={{
          display: 'inline-flex',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 180ms ease',
        }}>
          <ChevronDown size={14} stroke="var(--text-dim-2)" />
        </span>
      </div>

      {open && (
        <div style={{
          marginTop: 8,
          background: 'var(--surface-dropdown)',
          border: '1px solid var(--border-strong)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 12px 40px -12px rgba(0,0,0,0.7)',
        }}>

          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface-field)',
          }}>
            {/* Prev */}
            <button style={navBtn} onClick={() => {
              if (mode === 'day')   { const d = new Date(viewYear, viewMonth - 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
              if (mode === 'month') setViewYear(y => y - 1);
              if (mode === 'year')  setYearStart(s => s - YEAR_PAGE);
            }}>‹</button>

            {/* Mode toggle label */}
            <button
              onClick={() => setMode(m => m === 'day' ? 'month' : m === 'month' ? 'year' : 'year')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '2px 6px', borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
                {mode === 'day'   && `${MONTHS_LONG[viewMonth]} ${viewYear}`}
                {mode === 'month' && viewYear}
                {mode === 'year'  && `${yearStart} – ${yearStart + YEAR_PAGE - 1}`}
              </span>
            </button>

            {/* Next */}
            <button style={navBtn} onClick={() => {
              if (mode === 'day')   { const d = new Date(viewYear, viewMonth + 1, 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
              if (mode === 'month') setViewYear(y => y + 1);
              if (mode === 'year')  setYearStart(s => s + YEAR_PAGE);
            }}>›</button>
          </div>

          {/* ── Day grid ── */}
          {mode === 'day' && (
            <div style={{ padding: '10px 10px 10px' }}>
              {/* Weekday headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                {DAYS.map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text-dim-2)', letterSpacing: '0.06em', paddingBottom: 4 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const day    = i + 1;
                  const m      = String(viewMonth + 1).padStart(2, '0');
                  const dayStr = `${viewYear}-${m}-${String(day).padStart(2, '0')}`;
                  const isSel  = dayStr === value;
                  const isTod  = dayStr === todayStr;
                  const isOff  = dayStr < minStr;
                  return (
                    <button
                      key={day}
                      disabled={isOff}
                      onClick={() => pick(day)}
                      onMouseEnter={e => { if (!isOff && !isSel) e.currentTarget.style.background = 'var(--surface-hover-2)'; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                      style={{
                        ...btnStyle(isSel),
                        height: 30,
                        cursor: isOff ? 'default' : 'pointer',
                        color: isOff ? 'var(--text-dim-2)' : isSel ? '#fff' : isTod ? 'var(--accent)' : 'var(--text)',
                        boxShadow: isTod && !isSel ? 'inset 0 0 0 1px rgba(37,99,235,0.5)' : 'none',
                        opacity: isOff ? 0.3 : 1,
                      }}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Month grid ── */}
          {mode === 'month' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: 10 }}>
              {MONTHS_SHORT.map((m, i) => {
                const isActive = i === viewMonth && viewYear === Number((value || '').slice(0, 4));
                return (
                  <button
                    key={m}
                    onClick={() => pickMonth(i)}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover-2)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    style={{ ...btnStyle(isActive), padding: '9px 0', borderRadius: 8 }}>
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Year grid ── */}
          {mode === 'year' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: 10 }}>
              {Array.from({ length: YEAR_PAGE }).map((_, i) => {
                const y = yearStart + i;
                const isActive = y === viewYear;
                const isTodY   = y === Number(todayStr.slice(0, 4));
                return (
                  <button
                    key={y}
                    onClick={() => pickYear(y)}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-hover-2)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    style={{
                      ...btnStyle(isActive),
                      padding: '8px 0', borderRadius: 8,
                      color: isActive ? '#fff' : isTodY ? 'var(--accent)' : 'var(--text)',
                      boxShadow: isTodY && !isActive ? 'inset 0 0 0 1px rgba(37,99,235,0.45)' : 'none',
                    }}>
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* Today shortcut */}
          {mode === 'day' && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '7px 10px' }}>
              <button
                onClick={() => {
                  if (todayStr >= minStr) {
                    onChange(todayStr);
                    setOpen(false);
                  } else {
                    onChange(minStr);
                    setOpen(false);
                  }
                }}
                style={{
                  fontSize: 11, fontWeight: 500, color: 'var(--text-dim)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', padding: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}>
                Today →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
