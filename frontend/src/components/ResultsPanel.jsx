import { useState, useMemo, useEffect } from 'react';
import { formatINR, csvDownload } from '../lib/utils.js';
import { ChartIcon, TagIcon, TrendIcon, SparkIcon, FilterIcon, ChevronDown, DownloadIcon } from './Icons.jsx';
import { FlightCardGrid, FlightCardList } from './FlightCard.jsx';
import BarChart from './BarChart.jsx';

function Metric({ label, value, sub, icon, glow, accent }) {
  return (
    <div style={{
      background: glow ? 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.01))' : 'var(--surface-field)',
      border: glow ? '1px solid rgba(16,185,129,0.18)' : '1px solid var(--border)',
      boxShadow: glow ? '0 0 0 1px rgba(16,185,129,0.18) inset, 0 18px 60px -28px rgba(16,185,129,0.55)' : 'none',
      borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 8,
        background: 'var(--surface-raised)', border: '1px solid var(--border)',
        display: 'grid', placeItems: 'center',
      }}>{icon}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>{label}</div>
      <div className="tabnum" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.05, color: accent || 'var(--text)' }}>{value}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
        <span>{sub}</span>
        <span className="mono" style={{ color: accent || 'var(--text-dim)' }}>●</span>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { label: 'Price ↑',    key: 'price',        asc: true  },
  { label: 'Price ↓',    key: 'price',        asc: false },
  { label: 'Duration ↑', key: 'duration_min', asc: true  },
  { label: 'Duration ↓', key: 'duration_min', asc: false },
];

function MaxPriceSlider({ min, max, value, onChange, formatLabel }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginBottom: 8 }}>
        <span style={{ color: 'var(--text-dim-2)' }}>Min {formatLabel(min)}</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>Max {formatLabel(value)}</span>
      </div>
      <div style={{ position: 'relative', height: 4, background: 'var(--track-bg)', borderRadius: 4, margin: '8px 0' }}>
        <div style={{
          position: 'absolute', height: '100%', borderRadius: 4, left: 0, width: `${pct}%`,
          background: 'linear-gradient(90deg, #2563EB, #6366F1)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
          left: `${pct}%`,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff', border: '2px solid #2563EB',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }} />
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer', margin: 0 }}
      />
    </div>
  );
}

function AirlineFilter({ airlines, selected, onToggle, onClear }) {
  const [open, setOpen] = useState(false);
  const selectedCount = selected.size;
  return (
    <div style={{ position: 'relative' }} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 500,
          color: selectedCount > 0 ? 'var(--accent)' : 'var(--text-dim)',
          background: selectedCount > 0 ? 'rgba(37,99,235,0.1)' : 'var(--surface-pill)',
          border: selectedCount > 0 ? '1px solid rgba(37,99,235,0.4)' : '1px solid var(--border)',
          borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
        Airlines {selectedCount > 0 && `(${selectedCount})`} <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
          background: 'var(--surface-dropdown)', border: '1px solid var(--border-strong)',
          borderRadius: 10, padding: 8, minWidth: 180,
          boxShadow: '0 12px 40px -8px rgba(0,0,0,0.3)',
        }}>
          {selectedCount > 0 && (
            <button onClick={onClear}
              style={{ width: '100%', textAlign: 'left', padding: '6px 8px', fontSize: 11, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6, marginBottom: 4 }}>
              Clear filter
            </button>
          )}
          {airlines.map(a => (
            <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <input type="checkbox" checked={selected.has(a)} onChange={() => onToggle(a)} style={{ accentColor: 'var(--accent)' }} />
              {a}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsPanel({ results, origin, depDate }) {
  const [directOnly, setDirectOnly]       = useState(false);
  const [sortIdx, setSortIdx]             = useState(0);
  const [maxPrice, setMaxPrice]           = useState(null);
  const [airlineFilter, setAirlineFilter] = useState(new Set());
  const [viewMode, setViewMode]           = useState('grid'); // 'grid' | 'list'

  const allPrices  = useMemo(() => (results || []).map(r => r.price).filter(Boolean), [results]);
  const globalMin  = allPrices.length ? Math.min(...allPrices) : 0;
  const globalMax  = allPrices.length ? Math.max(...allPrices) : 1;
  const activeMax  = maxPrice ?? globalMax;

  // Reset filters whenever a new result set arrives
  useEffect(() => {
    setMaxPrice(null);
    setAirlineFilter(new Set());
    setDirectOnly(false);
  }, [results]);

  // Collect unique airlines for filter dropdown
  const allAirlines = useMemo(() => {
    const set = new Set((results || []).map(r => r.airline).filter(Boolean));
    return [...set].sort();
  }, [results]);

  function toggleAirline(a) {
    setAirlineFilter(prev => {
      const n = new Set(prev);
      n.has(a) ? n.delete(a) : n.add(a);
      return n;
    });
  }

  if (!results || results.length === 0) return (
    <div style={{
      border: '1px dashed var(--border-strong)', borderRadius: 16, padding: '64px 24px',
      textAlign: 'center',
      background: 'radial-gradient(400px 220px at 50% 30%, rgba(37,99,235,0.06), transparent 70%)',
    }}>
      <svg width="220" height="100" viewBox="0 0 220 100" style={{ marginBottom: 12 }}>
        <path d="M 10 70 Q 70 30, 130 50 T 210 30" stroke="#2563EB" strokeWidth="1.5" fill="none" strokeDasharray="6 6" opacity="0.6">
          <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.5s" repeatCount="indefinite"/>
        </path>
        <circle cx="10" cy="70" r="4" fill="#6366F1" opacity="0.8"/>
        <g transform="translate(195, 24) rotate(35)">
          <path d="M0 0 l-8 -3 l3 6 l-12 4 l4 5 l13 -3 l4 8 l4 -2 l-2 -10 l8 -3 l-2 -3 z" fill="#2563EB" />
        </g>
      </svg>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Select destinations and search to see fares</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 6 }}>Tip: pick 4–6 cities to compare best deals across a region</div>
    </div>
  );

  const sort = SORT_OPTIONS[sortIdx];
  let filtered = [...results];
  filtered = filtered.filter(r => r.price > 0);
  if (directOnly)             filtered = filtered.filter(r => r.stops === 'Direct');
  if (airlineFilter.size > 0) filtered = filtered.filter(r => airlineFilter.has(r.airline));
  filtered = filtered.filter(r => r.price <= activeMax);
  filtered.sort((a, b) => sort.asc ? (a[sort.key] || 0) - (b[sort.key] || 0) : (b[sort.key] || 0) - (a[sort.key] || 0));

  const prices        = filtered.map(r => r.price).filter(Boolean);
  const cheapest      = prices.length ? Math.min(...prices) : 0;
  const cheapestRoute = filtered.find(r => r.price === cheapest);
  const sortedPrices  = [...prices].sort((a, b) => a - b);
  const median        = sortedPrices.length ? sortedPrices[Math.floor(sortedPrices.length / 2)] : 0;
  const directs       = filtered.filter(r => r.stops === 'Direct').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Metrics */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <Metric label="Routes Found" value={filtered.length} sub={`${directs} direct · ${allAirlines.length} carriers`} icon={<ChartIcon size={14} stroke="var(--text-dim)" />} />
        <Metric label="Cheapest" value={cheapestRoute ? `₹${formatINR(cheapest)}` : '—'}
          sub={cheapestRoute ? `${cheapestRoute.code} · ${cheapestRoute.airline}` : ''}
          icon={<TagIcon size={14} stroke="var(--success)" />} glow accent="var(--success)" />
        <Metric label="Median Price" value={median ? `₹${formatINR(median)}` : '—'}
          sub="across filtered routes" icon={<TrendIcon size={14} stroke="var(--text-dim)" />} />
        <Metric label="Best Deal To" value={cheapestRoute ? cheapestRoute.city : '—'}
          sub={cheapestRoute ? cheapestRoute.airline : ''}
          icon={<SparkIcon size={14} stroke="#F59E0B" />} />
      </div>

      <BarChart results={filtered} />

      {/* Max price filter */}
      {globalMax > globalMin && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', background: 'var(--surface-card)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Max price
          </div>
          <MaxPriceSlider
            min={globalMin} max={globalMax}
            value={activeMax}
            onChange={v => setMaxPrice(v)}
            formatLabel={v => `₹${formatINR(v)}`}
          />
        </div>
      )}

      {/* Controls row */}
      <div className="controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          All flights
          <span style={{ color: 'var(--text-dim)', fontWeight: 500, marginLeft: 8 }}>{filtered.length} results</span>
          {filtered.length < results.length && (
            <span style={{ color: 'var(--text-dim-2)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
              (filtered from {results.length})
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer' }}>
            <input type="checkbox" checked={directOnly} onChange={e => setDirectOnly(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
            Direct only
          </label>

          <AirlineFilter airlines={allAirlines} selected={airlineFilter} onToggle={toggleAirline} onClear={() => setAirlineFilter(new Set())} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--text-dim)' }}>
            <FilterIcon size={12} />
            <select value={sortIdx} onChange={e => setSortIdx(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 11.5, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
              {SORT_OPTIONS.map((o, i) => <option key={i} value={i} style={{ background: 'var(--surface)' }}>{o.label}</option>)}
            </select>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
            {[['grid', '⊞'], ['list', '☰']].map(([mode, icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                title={mode === 'grid' ? 'Grid view' : 'List view'}
                style={{
                  padding: '5px 10px', fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: viewMode === mode ? 'rgba(37,99,235,0.2)' : 'var(--surface-pill)',
                  color: viewMode === mode ? 'var(--accent)' : 'var(--text-dim)',
                  borderRight: mode === 'grid' ? '1px solid var(--border)' : 'none',
                }}>
                {icon}
              </button>
            ))}
          </div>

          <button onClick={() => csvDownload(filtered)} style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 500,
            color: 'var(--text-dim)', background: 'var(--surface-pill)',
            border: '1px solid var(--border)', borderRadius: 7, padding: '5px 10px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <DownloadIcon size={12} /> Export CSV
          </button>
        </div>
      </div>

      {/* Cards */}
      {filtered.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {filtered.map((r, i) => (
              <FlightCardGrid key={`${r.code}-${i}`} flight={r} origin={origin} depDate={depDate} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((r, i) => (
              <FlightCardList key={`${r.code}-${i}`} flight={r} origin={origin} depDate={depDate} />
            ))}
          </div>
        )
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: 13 }}>
          No flights match the current filters.{' '}
          <button onClick={() => { setDirectOnly(false); setMaxPrice(null); setAirlineFilter(new Set()); }}
            style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
