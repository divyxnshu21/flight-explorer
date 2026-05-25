import { useEffect, useState } from 'react';
import { PinIcon, CalendarIcon, UsersIcon, DotIcon, ChevronDown } from './Icons.jsx';
import AirportSearch from './AirportSearch.jsx';
import DatePicker from './DatePicker.jsx';
import Logo from './Logo.jsx';

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function addDaysToIso(isoDate, n) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Next Saturday
function nextSaturday() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun … 6=Sat
  d.setDate(d.getDate() + ((6 - day + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

const DATE_PRESETS = [
  { label: 'This wknd', dep: () => nextSaturday(), ret: () => addDays(((6 - new Date().getDay() + 7) % 7 || 7) + 2) },
  { label: '+2 weeks',  dep: () => addDays(14),       ret: () => addDays(21) },
  { label: '+1 month',  dep: () => addDays(30),       ret: () => addDays(37) },
  { label: '+2 months', dep: () => addDays(60),       ret: () => addDays(67) },
];

const S = {
  sidebar: {
    width: 280, minWidth: 280,
    background: 'var(--surface-sidebar)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid var(--border)',
    padding: '20px 18px 24px',
    height: '100vh', position: 'sticky', top: 0,
    display: 'flex', flexDirection: 'column', gap: 20,
    overflowY: 'auto',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 16, borderBottom: '1px solid var(--border)',
  },
  logo: { display: 'flex', alignItems: 'center', minWidth: 0 },
  logoMark: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg, #2563EB, #6366F1)',
    display: 'grid', placeItems: 'center',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 6px 16px -8px rgba(99,102,241,0.7)',
  },
  apiPill: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 10.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em',
    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
    padding: '4px 8px', borderRadius: 999, fontWeight: 600,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 10 },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-dim)',
    paddingLeft: 8, borderLeft: '2px solid var(--accent)',
  },
  field: {
    background: 'var(--surface-field)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
  },
  fieldLabel: { fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 },
  fieldValue: { fontSize: 13, color: 'var(--text)', fontWeight: 500, lineHeight: 1.2 },
  cabinRow: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 },
  cabinChip: {
    padding: '7px 9px', fontSize: 11, fontWeight: 500, borderRadius: 7,
    border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-dim)',
    cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
  },
  cabinActive: {
    background: 'rgba(37,99,235,0.18)', borderColor: 'rgba(37,99,235,0.5)', color: '#fff',
  },
  tripTypeRow: { display: 'flex', gap: 6 },
  tripTypeBtn: (active) => ({
    flex: 1, padding: '7px 6px', fontSize: 11, fontWeight: 500, borderRadius: 7,
    border: active ? '1px solid rgba(37,99,235,0.5)' : '1px solid var(--border)',
    background: active ? 'rgba(37,99,235,0.18)' : 'transparent',
    color: active ? '#fff' : 'var(--text-dim)',
    cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
  }),
  shortcutRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' },
  kbd: {
    fontFamily: 'JetBrains Mono, monospace',
    background: 'var(--kbd-bg)', border: '1px solid var(--border)',
    borderRadius: 5, padding: '1px 6px', fontSize: 10.5, color: 'var(--text)',
  },
  counter: {
    display: 'flex', alignItems: 'center', gap: 0,
    border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden',
  },
  cBtn: {
    width: 28, height: 28, background: 'transparent', border: 'none',
    color: 'var(--text-dim)', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
    display: 'grid', placeItems: 'center',
  },
};

function Counter({ value, onChange, min = 1, max = 9 }) {
  return (
    <div style={S.counter}>
      <button style={S.cBtn} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', minWidth: 20, textAlign: 'center' }}>{value}</span>
      <button style={S.cBtn} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

export default function Sidebar({ settings, setSettings, apiStatus, collapsed, onToggleCollapse }) {
  const { origin, depDate, retDate, tripType, adults, cabin } = settings;
  const [editOrigin, setEditOrigin] = useState(false);
  const [returnOpenSignal, setReturnOpenSignal] = useState(0);
  const [returnAdjusted, setReturnAdjusted] = useState(false);

  function set(key, val) {
    setSettings(prev => ({ ...prev, [key]: val }));
  }

  function setDepartDate(nextDepDate) {
    if (tripType === 1 && retDate && retDate < nextDepDate) {
      const nextRetDate = addDaysToIso(nextDepDate, 6);
      setSettings(prev => ({ ...prev, depDate: nextDepDate, retDate: nextRetDate }));
      setReturnAdjusted(true);
      setReturnOpenSignal(n => n + 1);
      return;
    }

    setReturnAdjusted(false);
    set('depDate', nextDepDate);
  }

  function setReturnDate(nextRetDate) {
    setReturnAdjusted(false);
    set('retDate', nextRetDate);
  }

  useEffect(() => {
    if (tripType !== 1 || !depDate || !retDate || retDate >= depDate) return;

    const nextRetDate = addDaysToIso(depDate, 6);
    setSettings(prev => ({ ...prev, retDate: nextRetDate }));
    setReturnAdjusted(true);
    setReturnOpenSignal(n => n + 1);
  }, [tripType, depDate, retDate, setSettings]);

  if (collapsed) {
    return (
      <aside style={{
        width: 52, minWidth: 52, background: 'var(--surface-sidebar)',
        backdropFilter: 'blur(20px)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 20,
        height: '100vh', position: 'sticky', top: 0, transition: 'width 200ms ease',
      }}>
        <Logo collapsed />
        <button onClick={onToggleCollapse} title="Expand sidebar (⌘\)"
          style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'var(--text-dim)', display: 'grid', placeItems: 'center' }}>
          ›
        </button>
      </aside>
    );
  }

  return (
    <aside style={S.sidebar} className="sidebar-scroll">
      {/* Logo */}
      <div style={S.logoRow}>
        <div style={S.logo}>
          <Logo />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.apiPill}>
            <DotIcon color={apiStatus ? '#10B981' : '#F59E0B'} size={7} />
            {apiStatus ? 'LIVE' : 'OFFLINE'}
          </div>
          <button onClick={onToggleCollapse} title="Collapse sidebar (⌘\)"
            style={{ background: 'var(--surface-pill)', border: '1px solid var(--border)', borderRadius: 7, width: 26, height: 26, cursor: 'pointer', color: 'var(--text-dim-2)', display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>
            ‹
          </button>
        </div>
      </div>

      {/* Trip Settings */}
      <div style={S.section}>
        <div style={S.sectionLabel}>Trip Settings</div>

        {/* Origin */}
        <div>
          {editOrigin ? (
            <div>
              <AirportSearch
                value={origin}
                onChange={(apt) => { set('origin', apt); setEditOrigin(false); }}
                placeholder="Search origin airport…"
                autoFocus
              />
              <button onClick={() => setEditOrigin(false)}
                style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ ...S.field, cursor: 'pointer' }} onClick={() => setEditOrigin(true)}>
              <PinIcon size={16} stroke="var(--text-dim)" />
              <div style={{ flex: 1 }}>
                <div style={S.fieldLabel}>Origin</div>
                <div style={S.fieldValue}>{origin ? `${origin.code} · ${origin.city}` : 'Select origin'}</div>
              </div>
              <ChevronDown size={14} stroke="var(--text-dim-2)" />
            </div>
          )}
        </div>

        {/* Dates */}
        <div style={S.field}>
          <CalendarIcon size={16} stroke="var(--text-dim)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.fieldLabel}>Depart</div>
            <DatePicker
              value={depDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={setDepartDate}
            />
          </div>
        </div>

        {tripType === 1 && (
          <div style={S.field}>
            <CalendarIcon size={16} stroke="var(--text-dim)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.fieldLabel}>Return</div>
            <DatePicker
              value={retDate}
              min={depDate}
              onChange={setReturnDate}
              autoOpenSignal={returnOpenSignal}
              attention={returnAdjusted}
            />
            {returnAdjusted && (
              <div style={{ marginTop: 6, fontSize: 10.5, color: '#F59E0B', lineHeight: 1.35 }}>
                Return adjusted to 6 days after departure
              </div>
            )}
          </div>
        </div>
      )}

        {/* Quick date presets */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {DATE_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => { set('depDate', p.dep()); set('retDate', p.ret()); }}
              style={{
                fontSize: 10.5, fontWeight: 500, padding: '4px 9px', borderRadius: 999,
                border: '1px solid var(--border)', background: 'var(--surface-pill)',
                color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
            >{p.label}</button>
          ))}
        </div>

        {/* Trip type */}
        <div>
          <div style={{ ...S.fieldLabel, marginBottom: 6, paddingLeft: 2 }}>Trip Type</div>
          <div style={S.tripTypeRow}>
            <button style={S.tripTypeBtn(tripType === 1)} onClick={() => set('tripType', 1)}>Round Trip</button>
            <button style={S.tripTypeBtn(tripType === 2)} onClick={() => set('tripType', 2)}>One Way</button>
          </div>
        </div>

        {/* Passengers */}
        <div style={{ ...S.field, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UsersIcon size={16} stroke="var(--text-dim)" />
            <div>
              <div style={S.fieldLabel}>Adults</div>
              <div style={S.fieldValue}>{adults}</div>
            </div>
          </div>
          <Counter value={adults} onChange={v => set('adults', v)} />
        </div>

        {/* Cabin */}
        <div>
          <div style={{ ...S.fieldLabel, marginBottom: 6, paddingLeft: 2 }}>Cabin Class</div>
          <div style={S.cabinRow}>
            {[['Economy', 1], ['Premium', 2], ['Business', 3], ['First', 4]].map(([label, val]) => (
              <button key={val} onClick={() => set('cabin', val)}
                style={{ ...S.cabinChip, ...(cabin === val ? S.cabinActive : {}) }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div style={S.shortcutRow}><span>Search</span><span style={S.kbd}>⌘ K</span></div>
        <div style={S.shortcutRow}><span>Run query</span><span style={S.kbd}>⌘ ↵</span></div>
      </div>
    </aside>
  );
}
