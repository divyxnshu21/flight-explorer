const Icon = ({ children, size = 16, stroke = 'currentColor', strokeWidth = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    {children}
  </svg>
);

export const PlaneIcon = (p) => <Icon {...p}><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></Icon>;
export const PlaneTiltIcon = (p) => <Icon {...p}><path d="M14.64 3.66a2 2 0 0 1 2.83 2.83l-4.5 4.5 4.86 9.51-1.79 1.79-7.07-7.07-3.54 3.54.71 3.18-1.42 1.42-2.12-3.54-3.54-2.12 1.42-1.41 3.18.71 3.54-3.54L.56 6.39 2.35 4.6l9.5 4.86 4.5-4.5z"/></Icon>;
export const SearchIcon = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
export const MicIcon = (p) => <Icon {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>;
export const CalendarIcon = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></Icon>;
export const UsersIcon = (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-4-5.7"/></Icon>;
export const PinIcon = (p) => <Icon {...p}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></Icon>;
export const SeatIcon = (p) => <Icon {...p}><path d="M5 4v8a3 3 0 0 0 3 3h6"/><path d="M19 21H6a2 2 0 0 1-2-2v-4h11l4 6z"/></Icon>;
export const XIcon = (p) => <Icon {...p}><path d="M6 6l12 12M18 6l-12 12"/></Icon>;
export const SparkIcon = (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></Icon>;
export const ClockIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
export const TrendIcon = (p) => <Icon {...p}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></Icon>;
export const ChartIcon = (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 14v4M12 9v9M17 5v13"/></Icon>;
export const TagIcon = (p) => <Icon {...p}><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/></Icon>;
export const FilterIcon = (p) => <Icon {...p}><path d="M3 5h18M6 12h12M10 19h4"/></Icon>;
export const ChevronDown = (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>;
export const RefreshIcon = (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/></Icon>;
export const DownloadIcon = (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Icon>;
export const PlusIcon = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;

export const DotIcon = ({ color = '#10B981', size = 8 }) => (
  <span style={{
    display: 'inline-block', width: size, height: size, borderRadius: '50%',
    background: color, boxShadow: `0 0 8px ${color}`,
    animation: 'blink 2.4s ease-in-out infinite',
    flexShrink: 0,
  }} />
);

export const SunIcon = (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></Icon>;
export const MoonIcon = (p) => <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Icon>;

export const SpinnerIcon = ({ size = 16, color = 'var(--text-dim)' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
       strokeWidth="2" strokeLinecap="round"
       style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2a10 10 0 1 0 10 10" />
  </svg>
);
