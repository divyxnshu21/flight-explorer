import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import SearchBar from './components/SearchBar.jsx';
import SuggestionChips from './components/SuggestionChips.jsx';
import DestinationBrowser from './components/DestinationBrowser.jsx';
import QueryBar from './components/QueryBar.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import SkeletonCards from './components/SkeletonCards.jsx';
import Toast from './components/Toast.jsx';
import TopLoader from './components/TopLoader.jsx';
import RecentSearches from './components/RecentSearches.jsx';
import KeyboardHelp from './components/KeyboardHelp.jsx';
import { PlaneTiltIcon, SpinnerIcon, DotIcon, SunIcon, MoonIcon } from './components/Icons.jsx';
import { searchFlights, aiSearch, getHealth, searchAirports } from './lib/api.js';
import { defaultDepDate, defaultRetDate, encodeShareUrl, decodeShareUrl, timeAgo } from './lib/utils.js';
import { useLocalStorage } from './lib/useLocalStorage.js';
import { useWindowWidth } from './lib/useWindowWidth.js';
import { CURRENCIES, getCurrency } from './lib/currencies.js';

const DEFAULT_ORIGIN = { code: 'DEL', city: 'New Delhi', name: 'Indira Gandhi International Airport', country: 'India', flag: '🇮🇳' };
const DEFAULT_SETTINGS = { origin: DEFAULT_ORIGIN, depDate: defaultDepDate(), retDate: defaultRetDate(), tripType: 1, adults: 1, cabin: 1 };

export default function App() {
  const [settings, setSettings]         = useLocalStorage('fd_settings', DEFAULT_SETTINGS);
  const [selectedArr, setSelectedArr]   = useLocalStorage('fd_selected', []);
  const [recentSearches, setRecent]     = useLocalStorage('fd_recent', []);
  const [sidebarCollapsed, setSidebar]  = useLocalStorage('fd_sidebar', false);
  const [theme, setTheme]               = useLocalStorage('fd_theme', 'dark');
  const [currency, setCurrency]         = useLocalStorage('fd_currency', 'INR');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mode, setMode]                 = useState('general');
  const winWidth = useWindowWidth();
  const isMobile = winWidth < 768;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const selected = new Set(selectedArr);
  function setSelected(updater) {
    setSelectedArr(prev => [...(typeof updater === 'function' ? updater(new Set(prev)) : updater)]);
  }

  const [results,       setResults]      = useState(null);
  const [searching,     setSearching]    = useState(false);
  const [toast,         setToast]        = useState(null);
  const [chips,         setChips]        = useState([]);
  const [chipsLoading,  setChipsLoading] = useState(false);
  const [apiStatus,     setApiStatus]    = useState(false);
  const [showHelp,      setShowHelp]     = useState(false);
  const [copied,        setCopied]       = useState(false);

  // Load from URL params on first mount
  useEffect(() => {
    const p = decodeShareUrl();
    if (!p.originCode && !p.destinations) return;

    if (p.depDate)    setSettings(s => ({ ...s, depDate: p.depDate }));
    if (p.retDate)    setSettings(s => ({ ...s, retDate: p.retDate }));
    if (p.tripType)   setSettings(s => ({ ...s, tripType: p.tripType }));
    if (p.adults)     setSettings(s => ({ ...s, adults: p.adults }));
    if (p.cabin)      setSettings(s => ({ ...s, cabin: p.cabin }));
    if (p.destinations?.length) setSelectedArr(p.destinations);

    if (p.originCode) {
      searchAirports(p.originCode, 1).then(r => {
        if (r[0]) setSettings(s => ({ ...s, origin: r[0] }));
      }).catch(() => {});
    }
    // Clean URL after loading
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  useEffect(() => {
    getHealth().then(h => setApiStatus(h.serpapi)).catch(() => setApiStatus(false));
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setSidebar(c => !c);
      }
      if (!typing && e.key === '?') {
        e.preventDefault();
        setShowHelp(h => !h);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runSearchRef.current?.();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Use a ref so the keydown closure always has the latest runSearch
  const runSearchRef = { current: null };

  function showToast(message, type = 'error') { setToast({ message, type }); }

  function toggleDest(code) {
    setSelected(prev => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });
  }
  function removeDest(code) {
    setSelected(prev => { const n = new Set(prev); n.delete(code); return n; });
  }
  function addDest(code) {
    setSelected(prev => new Set([...prev, code]));
  }

  const handleSearch = useCallback(async (query) => {
    setChipsLoading(true);
    setChips([]);
    try {
      const { codes } = await aiSearch(query);
      if (codes?.length > 0) {
        const details = await Promise.all(codes.map(code => searchAirports(code, 1).then(r => r[0]).catch(() => null)));
        setChips(details.filter(Boolean));
      } else {
        setChips(await searchAirports(query, 8));
      }
    } catch {
      setChips(await searchAirports(query, 8).catch(() => []));
    } finally {
      setChipsLoading(false);
    }
  }, []);

  async function runSearch() {
    if (selected.size === 0) { showToast('Select at least one destination first', 'warning'); return; }
    if (!settings.origin)   { showToast('Select an origin airport first', 'warning'); return; }

    setSearching(true);
    setResults(null);

    // Save to recent searches
    const entry = {
      origin:       settings.origin.code,
      destinations: [...selected],
      depDate:      settings.depDate,
      retDate:      settings.retDate,
      tripType:     settings.tripType,
      adults:       settings.adults,
      cabin:        settings.cabin,
      timestamp:    new Date().toISOString(),
      timeAgo:      'just now',
    };
    setRecent(prev => [entry, ...prev.filter(p => p.origin !== entry.origin || p.destinations.join() !== entry.destinations.join()).slice(0, 4)]);

    try {
      const data = await searchFlights({
        origin:       settings.origin.code,
        destinations: [...selected],
        depDate:      settings.depDate,
        retDate:      settings.tripType === 1 ? settings.retDate : null,
        tripType:     settings.tripType,
        adults:       settings.adults,
        cabin:        settings.cabin,
        currency,
      });

      setResults(data.results || []);

      if (data.errors?.length > 0) showToast(`No results for: ${data.errors.map(e => e.destination).join(', ')}`, 'warning');
      if ((data.results || []).length === 0) showToast('No flights found — try different dates or destinations', 'warning');
      else showToast(`Found ${data.results.length} flights across ${selected.size} routes`, 'success');
    } catch (err) {
      showToast(err.message || 'Search failed. Check your API key.', 'error');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }
  runSearchRef.current = runSearch;

  function restoreSearch(s) {
    setSettings(prev => ({
      ...prev,
      depDate:  s.depDate,
      retDate:  s.retDate,
      tripType: s.tripType,
      adults:   s.adults,
      cabin:    s.cabin,
    }));
    setSelectedArr(s.destinations);
    showToast('Search restored — hit Search Flights to run it', 'success');
  }

  function copyShareUrl() {
    const url = encodeShareUrl(settings, selected);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Update timeAgo labels on recentSearches every minute
  const displayRecent = recentSearches.map(s => ({ ...s, timeAgo: timeAgo(s.timestamp) }));

  const destCount = selected.size;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <TopLoader active={searching} />

      {/* Desktop sidebar — hidden on mobile */}
      {!isMobile && (
        <Sidebar
          settings={settings}
          setSettings={setSettings}
          apiStatus={apiStatus}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebar(c => !c)}
        />
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileSidebarOpen && (
        <>
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 999, overflowY: 'auto' }}>
            <Sidebar
              settings={settings}
              setSettings={setSettings}
              apiStatus={apiStatus}
              collapsed={false}
              onToggleCollapse={() => setMobileSidebarOpen(false)}
            />
          </div>
        </>
      )}

      <main className="main-content" style={{ flex: 1, padding: '24px 36px 64px', display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>

        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-dim)' }}>
            {/* Mobile sidebar toggle */}
            {isMobile && (
              <button
                onClick={() => setMobileSidebarOpen(true)}
                title="Trip settings"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--surface-raised)', color: 'var(--text-dim)',
                  cursor: 'pointer', fontSize: 15, marginRight: 2,
                }}>
                ☰
              </button>
            )}
            {/* Mode tabs */}
            {[
              { id: 'general', label: 'General Search' },
              { id: 'custom',  label: 'Custom' },
              { id: 'agentic', label: 'Agentic Mode' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                style={{
                  padding: '3px 10px', borderRadius: 7, border: 'none',
                  background: mode === id ? 'rgba(99,102,241,0.18)' : 'transparent',
                  color: mode === id ? '#a5b4fc' : 'var(--text-dim)',
                  fontWeight: mode === id ? 600 : 400,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 150ms ease, color 150ms ease',
                }}>
                {label}
              </button>
            ))}
            {mode === 'general' && results !== null && (
              <>
                <span style={{ color: 'var(--text-dim-2)' }}>/</span>
                <span style={{ color: 'var(--success)', fontWeight: 500 }}>{results.length} flights</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Share button */}
            {destCount > 0 && (
              <button onClick={copyShareUrl} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                borderRadius: 999, fontSize: 11, border: '1px solid var(--border)',
                background: copied ? 'rgba(16,185,129,0.12)' : 'var(--surface-pill)',
                color: copied ? '#34d399' : 'var(--text-dim)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 200ms ease',
              }}>
                {copied ? '✓ Copied!' : '⎘ Share'}
              </button>
            )}
            {/* Keyboard help — hidden on mobile */}
            {!isMobile && (
              <button onClick={() => setShowHelp(true)} title="Keyboard shortcuts (?)"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                  borderRadius: 999, fontSize: 11, border: '1px solid var(--border)',
                  background: 'var(--surface-pill)', color: 'var(--text-dim)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                ? Shortcuts
              </button>
            )}
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                borderRadius: 999, fontSize: 11, border: '1px solid var(--border)',
                background: 'var(--surface-pill)', color: 'var(--text-dim)',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
              }}>
              {theme === 'dark'
                ? <SunIcon size={12} stroke="var(--text-dim)" />
                : <MoonIcon size={12} stroke="var(--text-dim)" />}
              {!isMobile && (theme === 'dark' ? 'Light' : 'Dark')}
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, fontSize: 11, border: '1px solid var(--border)', background: 'var(--surface-pill)', color: 'var(--text-dim)' }}>
              <DotIcon color={apiStatus ? '#10B981' : '#F59E0B'} size={6} />
              {isMobile ? (apiStatus ? 'Live' : 'Off') : (apiStatus ? 'SerpAPI · Live' : 'Offline')}
            </div>
            <CurrencyPicker currency={currency} onChange={setCurrency} />
          </div>
        </div>

        {mode === 'general' ? (
          <>
            {/* Hero search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SearchBar onSearch={handleSearch} onVoiceResult={handleSearch} loading={chipsLoading} />
              <SuggestionChips chips={chips} loading={chipsLoading} onToggle={toggleDest} selected={selected} />
            </div>

            {/* Recent searches */}
            <RecentSearches
              searches={displayRecent}
              onRestore={restoreSearch}
              onClear={() => setRecent([])}
            />

            {/* Destination browser */}
            <DestinationBrowser selected={selected} onToggle={toggleDest} onSetMany={setSelected} />

            {/* Query bar */}
            <QueryBar selected={selected} onRemove={removeDest} onClear={() => setSelected(new Set())} onAdd={addDest} />

            {/* Search button */}
            <SearchButton count={destCount} loading={searching} onSearch={runSearch} />

            {/* Results / Skeleton / Empty */}
            {searching
              ? <SkeletonCards count={Math.min(destCount, 6)} />
              : <ResultsPanel results={results} origin={settings.origin?.code} depDate={settings.depDate} currency={currency} />
            }
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: '80px 0',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--text-dim-2)', fontFamily: 'JetBrains Mono, monospace',
            }}>Work in Progress</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {mode === 'custom' ? 'Custom Search' : 'Agentic Mode'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
              {mode === 'custom'
                ? 'Build your own search with custom filters and rules. Coming soon.'
                : 'An AI agent that plans and books your trip end-to-end. Coming soon.'}
            </div>
          </div>
        )}
      </main>

      {toast    && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      {showHelp && <KeyboardHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function CurrencyPicker({ currency, onChange }) {
  const [open, setOpen] = useState(false);
  const curr = getCurrency(currency);

  return (
    <div
      style={{ position: 'relative' }}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change display currency"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 999, fontSize: 11,
          border: '1px solid var(--border)',
          background: open ? 'var(--surface-hover)' : 'var(--surface-pill)',
          color: 'var(--text-dim)', cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 150ms ease',
        }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--text)' }}>{curr.code}</span>
        <span style={{ color: 'var(--text-dim-2)' }}>·</span>
        <span>{curr.symbol}</span>
        <span style={{ fontSize: 8, color: 'var(--text-dim-2)', marginLeft: 1 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
          background: 'var(--surface-dropdown)', border: '1px solid var(--border-strong)',
          borderRadius: 10, overflow: 'hidden', minWidth: 196,
          boxShadow: '0 12px 40px -8px rgba(0,0,0,0.35)',
        }}>
          {CURRENCIES.map((c, i) => (
            <button
              key={c.code}
              onMouseDown={() => { onChange(c.code); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                background: c.code === currency ? 'rgba(37,99,235,0.10)' : 'transparent',
                border: 'none',
                borderBottom: i < CURRENCIES.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}
              onMouseEnter={e => { if (c.code !== currency) e.currentTarget.style.background = 'var(--surface-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = c.code === currency ? 'rgba(37,99,235,0.10)' : 'transparent'; }}>
              <span className="mono" style={{ fontSize: 12, fontWeight: 700, minWidth: 38, color: c.code === currency ? 'var(--accent)' : 'var(--text)' }}>{c.code}</span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', flex: 1 }}>{c.name}</span>
              <span className="mono" style={{ fontSize: 13, color: 'var(--text-dim-2)', minWidth: 24, textAlign: 'right' }}>{c.symbol}</span>
              {c.code === currency && <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 4 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchButton({ count, loading, onSearch }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      disabled={loading}
      onClick={onSearch}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', height: 52, border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        borderRadius: 14,
        background: 'linear-gradient(120deg, #2563EB 0%, #6366F1 100%)',
        backgroundSize: '200% 100%', backgroundPosition: hover ? '100% 0' : '0% 0',
        color: '#fff', fontWeight: 600, fontSize: 14, letterSpacing: '0.01em',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        boxShadow: '0 0 0 1px rgba(99,102,241,0.45), 0 22px 50px -22px rgba(37,99,235,0.7)',
        position: 'relative', overflow: 'hidden',
        opacity: loading ? 0.7 : 1,
        transition: 'background-position 600ms ease, opacity 200ms ease',
        fontFamily: 'inherit',
      }}>
      {hover && !loading && (
        <span style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
          backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite', pointerEvents: 'none',
        }} />
      )}
      {loading ? <SpinnerIcon size={18} color="#fff" /> : <PlaneTiltIcon size={16} stroke="#fff" fill="#fff" strokeWidth={0} />}
      <span>{loading ? 'Searching…' : 'Search Flights'}</span>
      {count > 0 && !loading && (
        <span style={{ marginLeft: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.18)', borderRadius: 999 }} className="mono tabnum">
          {count} routes
        </span>
      )}
    </button>
  );
}
