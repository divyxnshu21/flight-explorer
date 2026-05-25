import { useState } from 'react';
import { REGIONS, COUNTRIES } from '../lib/destinations.js';

export default function DestinationBrowser({ selected, onToggle, onSetMany }) {
  const [region, setRegion] = useState('seasia');
  // Track expanded sections — default nothing expanded = all collapsed
  const [expanded, setExpanded] = useState(new Set());

  function toggleCollapse(name) {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  }
  const countries = COUNTRIES[region] || [];
  const regionCodes = countries.flatMap(c => c.cities.map(d => d.code));
  const allSelected = regionCodes.length > 0 && regionCodes.every(c => selected.has(c));

  function toggleRegion() {
    if (allSelected) {
      onSetMany(prev => { const n = new Set(prev); regionCodes.forEach(c => n.delete(c)); return n; });
    } else {
      onSetMany(prev => new Set([...prev, ...regionCodes]));
    }
  }

  function toggleCountry(codes) {
    const allIn = codes.every(c => selected.has(c));
    if (allIn) {
      onSetMany(prev => { const n = new Set(prev); codes.forEach(c => n.delete(c)); return n; });
    } else {
      onSetMany(prev => new Set([...prev, ...codes]));
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Destination browser</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
            Pick cities you want fares for · multi-select supported
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={toggleRegion}
            style={{
              fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              color: allSelected ? '#f87171' : 'var(--accent)',
              background: 'none', border: 'none', padding: 0,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
            {allSelected ? 'Clear region' : 'Select all'}
          </button>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
            {selected.size} <span style={{ color: 'var(--text-dim-2)' }}>selected</span>
          </div>
        </div>
      </div>

      {/* Region tabs */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
        borderBottom: '1px solid var(--border)',
      }} className="noscroll">
        {REGIONS.map(r => {
          const active = r.id === region;
          const regionDests = (COUNTRIES[r.id] || []).flatMap(c => c.cities);
          const anySelected = regionDests.some(d => selected.has(d.code));
          return (
            <div
              key={r.id}
              onClick={() => setRegion(r.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 14px', fontSize: 13, fontWeight: 500,
                color: active ? 'var(--text)' : 'var(--text-dim)',
                background: active ? 'var(--surface-tab-active)' : 'transparent',
                border: '1px solid ' + (active ? 'var(--border-strong)' : 'transparent'),
                borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap',
                position: 'relative',
              }}>
              {r.cc
                ? <span className={`fi fi-${r.cc}`} style={{ width: 20, height: 14, borderRadius: 2, display: 'inline-block', backgroundSize: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                : <span>{r.flag}</span>
              }
              <span>{r.name}</span>
              {anySelected && !active && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', flexShrink: 0 }} />
              )}
              {active && (
                <span style={{
                  position: 'absolute', bottom: -1, left: 12, right: 12, height: 2,
                  background: 'linear-gradient(90deg, #2563EB, #6366F1)', borderRadius: 2,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Countries + cities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
        {countries.map(country => {
          const codes = country.cities.map(d => d.code);
          const allIn = codes.every(c => selected.has(c));
          const anyIn = codes.some(c => selected.has(c));
          const isCollapsed = !expanded.has(country.name);
          return (
            <div key={country.name}>
              {/* Country header */}
              <div
                onClick={() => toggleCollapse(country.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  marginBottom: isCollapsed ? 0 : 8, paddingBottom: 6,
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', userSelect: 'none',
                }}>
                {/* Chevron */}
                <span style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  background: 'var(--surface-hover-2)', border: '1px solid var(--border)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'var(--text-dim)',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 180ms ease',
                }}>▾</span>
                {country.cc
                  ? <span className={`fi fi-${country.cc}`} style={{ width: 22, height: 15, borderRadius: 3, display: 'inline-block', backgroundSize: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                  : <span style={{ fontSize: 14 }}>{country.flag}</span>
                }
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                  {country.name}
                </span>
                {anyIn && (
                  <span style={{
                    fontSize: 10, color: '#60a5fa', background: 'rgba(37,99,235,0.15)',
                    border: '1px solid rgba(37,99,235,0.3)', borderRadius: 999,
                    padding: '1px 6px', fontWeight: 600,
                  }}>
                    {codes.filter(c => selected.has(c)).length}
                  </span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); toggleCountry(codes); }}
                  style={{
                    marginLeft: 'auto', fontSize: 10.5, fontWeight: 500, cursor: 'pointer',
                    color: allIn ? '#f87171' : 'var(--text-dim-2)',
                    background: 'none', border: 'none', padding: 0, fontFamily: 'inherit',
                  }}>
                  {allIn ? '− clear' : '+ all'}
                </button>
              </div>

              {/* City cards — hidden when collapsed */}
              {!isCollapsed && (
                <div className="dest-grid" style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
                }}>
                  {country.cities.map(d => {
                    const sel = selected.has(d.code);
                    return (
                      <div
                        key={d.code}
                        onClick={() => onToggle(d.code)}
                        style={{
                          border: '1px solid ' + (sel ? 'transparent' : 'var(--border)'),
                          background: sel ? 'linear-gradient(135deg, #2563EB, #1d4ed8)' : 'var(--surface-card)',
                          borderRadius: 10, padding: '11px 13px',
                          display: 'flex', flexDirection: 'column', gap: 2,
                          cursor: 'pointer',
                          boxShadow: sel ? '0 0 0 1px rgba(37,99,235,0.55), 0 10px 28px -14px rgba(37,99,235,0.7)' : 'none',
                          transition: 'all 140ms ease',
                        }}>
                        <div style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700,
                          color: sel ? '#fff' : 'var(--text)', letterSpacing: '0.04em',
                        }}>{d.code}</div>
                        <div style={{ fontSize: 11, color: sel ? 'rgba(255,255,255,0.8)' : 'var(--text-dim)' }}>
                          {d.city}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
