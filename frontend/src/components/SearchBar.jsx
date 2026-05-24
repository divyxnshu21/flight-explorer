import { useState, useRef, useEffect } from 'react';
import { SearchIcon, MicIcon, SparkIcon, SpinnerIcon } from './Icons.jsx';

export default function SearchBar({ onSearch, onVoiceResult, loading }) {
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function submit(q) {
    const trimmed = q.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  }

  function handleKey(e) {
    if (e.key === 'Enter') submit(query);
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice input not supported in this browser.'); return; }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setQuery(transcript);
      onVoiceResult(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognizerRef.current = rec;
    rec.start();
    setListening(true);
  }

  const [focused, setFocused] = useState(false);

  return (
    <div style={{
      position: 'relative', borderRadius: 16, padding: 1.5,
      background: 'linear-gradient(120deg, #2563EB 0%, #6366F1 100%)',
      boxShadow: focused
        ? '0 0 0 4px rgba(37,99,235,0.18), 0 30px 80px -30px rgba(99,102,241,0.7)'
        : '0 22px 60px -32px rgba(99,102,241,0.4)',
      transition: 'box-shadow 200ms ease',
    }}>
      <div style={{
        background: '#0c1322', borderRadius: 14.5, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {loading
          ? <SpinnerIcon size={20} color="var(--text-dim)" />
          : <SearchIcon size={20} stroke="var(--text-dim)" />}
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search destinations, cities, or describe your trip…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 15, fontFamily: 'Inter', fontWeight: 400,
          }}
        />
        <div className="mono" style={{
          fontSize: 10.5, color: 'var(--text-dim-2)', padding: '2px 7px',
          border: '1px solid var(--border)', borderRadius: 5,
        }}>⌘ K</div>
        {query.trim() && (
          <button
            onClick={() => submit(query)}
            title="AI Search"
            style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(99,102,241,0.4)',
              background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
            <SparkIcon size={15} />
          </button>
        )}
        <button
          onClick={startVoice}
          title={listening ? 'Listening…' : 'Voice search'}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: listening ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border)',
            background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
            color: listening ? '#f87171' : 'var(--text-dim)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            animation: listening ? 'blink 1s ease-in-out infinite' : 'none',
          }}>
          <MicIcon size={16} />
        </button>
      </div>
    </div>
  );
}
