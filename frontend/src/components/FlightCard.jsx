import { PlaneTiltIcon, ClockIcon } from './Icons.jsx';
import { getCurrency, formatPrice } from '../lib/currencies.js';

const PILL_INCLUDED = { border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.07)', color: 'var(--success)' };
const PILL_FEE      = { border: '1px solid rgba(245,158,11,0.28)',  background: 'rgba(245,158,11,0.07)',  color: 'var(--warn)' };
const PILL_UNKNOWN  = { border: '1px solid var(--border)',           background: 'var(--surface-pill)', color: 'var(--text-dim-2)' };

function baggagePillStyle(info) {
  if (!info) return PILL_UNKNOWN;
  return info.included ? PILL_INCLUDED : PILL_FEE;
}

function BaggageRow({ baggage }) {
  const cabin   = baggage?.cabin;
  const checked = baggage?.checked;

  const base = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 500 };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: 'var(--text-dim-2)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginRight: 2 }}>Baggage</span>
      <span style={{ ...base, ...baggagePillStyle(cabin) }} title="Cabin / carry-on bag">
        🎒 {cabin ? cabin.label : 'Not listed'}
      </span>
      <span style={{ ...base, ...baggagePillStyle(checked) }} title="Checked bag">
        🧳 {checked ? checked.label : 'Not listed'}
      </span>
    </div>
  );
}

function parseTime(raw) {
  if (!raw || raw === '—') return '—';
  const m = raw.match(/(\d{2}:\d{2})/);
  return m ? m[1] : raw;
}

function googleFlightsUrl(flight, origin, depDate) {
  return `https://www.google.com/travel/flights?q=flights+from+${origin || 'DEL'}+to+${flight.code}+on+${depDate || ''}`;
}

export function FlightCardGrid({ flight, origin, depDate, currency = 'INR' }) {
  const isDirect = flight.stops === 'Direct';
  const depTime  = parseTime(flight.departure);
  const arrTime  = parseTime(flight.arrival);
  const { symbol } = getCurrency(currency);

  return (
    <div
      style={{
        border: '1px solid var(--border)', borderRadius: 14, padding: 18,
        background: 'var(--surface-card)',
        position: 'relative', display: 'flex', flexDirection: 'column',
        transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.boxShadow = '0 24px 60px -30px rgba(37,99,235,0.5)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>

      {flight.type === 'Best' && (
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'linear-gradient(135deg, #10B981, #059669)', color: '#04150E',
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em',
          padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase',
          boxShadow: '0 0 0 1px rgba(16,185,129,0.4), 0 4px 12px -2px rgba(16,185,129,0.4)',
        }}>Best Deal</div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flexShrink: 0, marginTop: 4 }}>
          {flight.country_code
            ? <span className={`fi fi-${flight.country_code}`} style={{ width: 36, height: 24, borderRadius: 4, display: 'block', border: '1px solid var(--border-strong)', backgroundSize: 'cover' }} />
            : <span style={{ fontSize: 26, lineHeight: 1 }}>{flight.flag || '✈️'}</span>
          }
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{flight.city}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
            <span className="mono" style={{ color: 'var(--text)' }}>{flight.code}</span>
            {flight.country && ` · ${flight.country}`}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginTop: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>From</div>
          <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 4, fontWeight: 500 }}>{flight.airline}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="tabnum" style={{ fontSize: 26, fontWeight: 700, color: 'var(--success)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {symbol}{formatPrice(flight.price, currency)}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>per adult</div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="mono tabnum" style={{ fontSize: 15, fontWeight: 600 }}>{depTime}</span>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-dim-2)' }} />
          <div style={{ flex: 1, height: 1, background: 'var(--border-strong)' }} />
          <PlaneTiltIcon size={11} stroke="var(--text-dim)" fill="var(--text-dim)" strokeWidth={0} />
          <div style={{ flex: 1, height: 1, background: 'var(--border-strong)' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-dim-2)' }} />
        </div>
        <span className="mono tabnum" style={{ fontSize: 15, fontWeight: 600 }}>{arrTime}</span>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, border: '1px solid var(--border)', background: 'var(--surface-pill)', color: 'var(--text-dim)' }}>
          <ClockIcon size={11} /> {flight.duration}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999,
          fontSize: 11, fontWeight: 500,
          border: isDirect ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.28)',
          background: isDirect ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
          color: isDirect ? 'var(--success)' : 'var(--warn)',
        }}>
          {isDirect ? '● Direct' : flight.stops}
        </span>
      </div>

      <BaggageRow baggage={flight.baggage} />

      <a href={googleFlightsUrl(flight, origin, depDate)} target="_blank" rel="noopener noreferrer"
        style={{
          marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
          color: 'var(--text-dim)', background: 'var(--surface-pill)',
          border: '1px solid var(--border)', textDecoration: 'none',
          transition: 'all 140ms ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.background = 'rgba(37,99,235,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-pill)'; }}>
        View on Google Flights ↗
      </a>
    </div>
  );
}

export function FlightCardList({ flight, origin, depDate, currency = 'INR' }) {
  const isDirect = flight.stops === 'Direct';
  const depTime  = parseTime(flight.departure);
  const arrTime  = parseTime(flight.arrival);
  const { symbol } = getCurrency(currency);

  return (
    <div
      style={{
        border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px',
        background: 'var(--surface-card)',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'border-color 150ms ease, background 150ms ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--surface-pill)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-card)'; }}>

      {/* Flag + city */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160 }}>
        {flight.country_code
          ? <span className={`fi fi-${flight.country_code}`} style={{ width: 30, height: 20, borderRadius: 3, display: 'block', flexShrink: 0, border: '1px solid var(--border-strong)', backgroundSize: 'cover' }} />
          : <span style={{ fontSize: 22 }}>{flight.flag || '✈️'}</span>
        }
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{flight.city}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>
            <span className="mono" style={{ color: 'var(--text)' }}>{flight.code}</span>
            {flight.country && ` · ${flight.country}`}
          </div>
        </div>
      </div>

      {/* Airline */}
      <div style={{ minWidth: 130 }}>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 2 }}>Airline</div>
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{flight.airline}</div>
      </div>

      {/* Times */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <span className="mono tabnum" style={{ fontSize: 14, fontWeight: 600 }}>{depTime}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-strong)' }} />
          <PlaneTiltIcon size={10} stroke="var(--text-dim)" fill="var(--text-dim)" strokeWidth={0} />
          <div style={{ flex: 1, height: 1, background: 'var(--border-strong)' }} />
        </div>
        <span className="mono tabnum" style={{ fontSize: 14, fontWeight: 600 }}>{arrTime}</span>
      </div>

      {/* Duration + stops + baggage */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minWidth: 140, justifyContent: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, fontSize: 11, border: '1px solid var(--border)', background: 'var(--surface-pill)', color: 'var(--text-dim)' }}>
          <ClockIcon size={10} /> {flight.duration}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '3px 8px', borderRadius: 999, fontSize: 11,
          border: isDirect ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.28)',
          background: isDirect ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
          color: isDirect ? 'var(--success)' : 'var(--warn)',
        }}>
          {isDirect ? '● Direct' : flight.stops}
        </span>
        <span title="Cabin bag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, fontSize: 11, ...baggagePillStyle(flight.baggage?.cabin) }}>
          🎒 {flight.baggage?.cabin ? flight.baggage.cabin.label : 'Not listed'}
        </span>
        <span title="Checked bag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, fontSize: 11, ...baggagePillStyle(flight.baggage?.checked) }}>
          🧳 {flight.baggage?.checked ? flight.baggage.checked.label : 'Not listed'}
        </span>
      </div>

      {/* Price + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
        <div style={{ textAlign: 'right' }}>
          {flight.type === 'Best' && (
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Best Deal</div>
          )}
          <div className="tabnum" style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {symbol}{formatPrice(flight.price, currency)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>per adult</div>
        </div>
        <a href={googleFlightsUrl(flight, origin, depDate)} target="_blank" rel="noopener noreferrer"
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            color: 'var(--accent)', background: 'rgba(37,99,235,0.08)',
            border: '1px solid rgba(37,99,235,0.3)', textDecoration: 'none', whiteSpace: 'nowrap',
            transition: 'all 140ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.18)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; }}>
          View ↗
        </a>
      </div>
    </div>
  );
}

// Default export stays for backward compat
export default FlightCardGrid;
