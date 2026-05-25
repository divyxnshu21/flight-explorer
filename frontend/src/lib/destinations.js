export const REGIONS = [
  { id: 'seasia',    flag: '🌏',   cc: null, name: 'SE Asia' },
  { id: 'me',        flag: '🌙',   cc: null, name: 'Middle East' },
  { id: 'europe',    flag: '🇪🇺', cc: 'eu', name: 'Europe' },
  { id: 'eastasia',  flag: '🎌',   cc: null, name: 'East Asia' },
  { id: 'southasia', flag: '🏝️',  cc: null, name: 'South Asia' },
  { id: 'americas',  flag: '🌎',   cc: null, name: 'Americas' },
  { id: 'oceania',   flag: '🦘',   cc: null, name: 'Oceania' },
  { id: 'domestic',  flag: '🇮🇳', cc: 'in', name: 'India' },
];

// Region → Country → Cities (the source of truth)
export const COUNTRIES = {
  domestic: [
    { name: 'North India', flag: '🏔️', cc: 'in', cities: [
      { code: 'DEL', city: 'Delhi' },
      { code: 'JAI', city: 'Jaipur' },
      { code: 'AMD', city: 'Ahmedabad' },
      { code: 'LKO', city: 'Lucknow' },
    ]},
    { name: 'South India', flag: '🌴', cc: 'in', cities: [
      { code: 'BLR', city: 'Bengaluru' },
      { code: 'MAA', city: 'Chennai' },
      { code: 'HYD', city: 'Hyderabad' },
      { code: 'COK', city: 'Kochi' },
    ]},
    { name: 'West & East', flag: '🏙️', cc: 'in', cities: [
      { code: 'BOM', city: 'Mumbai' },
      { code: 'GOI', city: 'Goa' },
      { code: 'CCU', city: 'Kolkata' },
      { code: 'IXZ', city: 'Andaman' },
    ]},
  ],
  seasia: [
    { name: 'Thailand', flag: '🇹🇭', cc: 'th', cities: [
      { code: 'BKK', city: 'Bangkok' },
      { code: 'HKT', city: 'Phuket' },
      { code: 'CNX', city: 'Chiang Mai' },
      { code: 'USM', city: 'Koh Samui' },
      { code: 'KBV', city: 'Krabi' },
    ]},
    { name: 'Vietnam', flag: '🇻🇳', cc: 'vn', cities: [
      { code: 'SGN', city: 'Ho Chi Minh' },
      { code: 'HAN', city: 'Hanoi' },
      { code: 'DAD', city: 'Da Nang' },
      { code: 'CXR', city: 'Nha Trang' },
      { code: 'PQC', city: 'Phu Quoc' },
    ]},
    { name: 'Singapore', flag: '🇸🇬', cc: 'sg', cities: [
      { code: 'SIN', city: 'Singapore' },
    ]},
    { name: 'Malaysia', flag: '🇲🇾', cc: 'my', cities: [
      { code: 'KUL', city: 'Kuala Lumpur' },
      { code: 'PEN', city: 'Penang' },
    ]},
    { name: 'Indonesia', flag: '🇮🇩', cc: 'id', cities: [
      { code: 'DPS', city: 'Bali' },
      { code: 'CGK', city: 'Jakarta' },
      { code: 'LOP', city: 'Lombok' },
    ]},
    { name: 'Philippines', flag: '🇵🇭', cc: 'ph', cities: [
      { code: 'MNL', city: 'Manila' },
      { code: 'CEB', city: 'Cebu' },
      { code: 'BCD', city: 'Boracay' },
    ]},
    { name: 'Cambodia', flag: '🇰🇭', cc: 'kh', cities: [
      { code: 'PNH', city: 'Phnom Penh' },
      { code: 'REP', city: 'Siem Reap' },
    ]},
  ],
  me: [
    { name: 'UAE', flag: '🇦🇪', cc: 'ae', cities: [
      { code: 'DXB', city: 'Dubai' },
      { code: 'AUH', city: 'Abu Dhabi' },
      { code: 'SHJ', city: 'Sharjah' },
    ]},
    { name: 'Qatar', flag: '🇶🇦', cc: 'qa', cities: [
      { code: 'DOH', city: 'Doha' },
    ]},
    { name: 'Oman', flag: '🇴🇲', cc: 'om', cities: [
      { code: 'MCT', city: 'Muscat' },
    ]},
    { name: 'Saudi Arabia', flag: '🇸🇦', cc: 'sa', cities: [
      { code: 'JED', city: 'Jeddah' },
      { code: 'RUH', city: 'Riyadh' },
    ]},
    { name: 'Kuwait', flag: '🇰🇼', cc: 'kw', cities: [
      { code: 'KWI', city: 'Kuwait City' },
    ]},
    { name: 'Bahrain', flag: '🇧🇭', cc: 'bh', cities: [
      { code: 'BAH', city: 'Manama' },
    ]},
  ],
  europe: [
    { name: 'UK', flag: '🇬🇧', cc: 'gb', cities: [
      { code: 'LHR', city: 'London' },
      { code: 'MAN', city: 'Manchester' },
      { code: 'BHX', city: 'Birmingham' },
    ]},
    { name: 'France', flag: '🇫🇷', cc: 'fr', cities: [
      { code: 'CDG', city: 'Paris' },
      { code: 'NCE', city: 'Nice' },
    ]},
    { name: 'Italy', flag: '🇮🇹', cc: 'it', cities: [
      { code: 'FCO', city: 'Rome' },
      { code: 'MXP', city: 'Milan' },
      { code: 'VCE', city: 'Venice' },
    ]},
    { name: 'Switzerland', flag: '🇨🇭', cc: 'ch', cities: [
      { code: 'ZRH', city: 'Zurich' },
      { code: 'GVA', city: 'Geneva' },
    ]},
    { name: 'Germany', flag: '🇩🇪', cc: 'de', cities: [
      { code: 'FRA', city: 'Frankfurt' },
      { code: 'MUC', city: 'Munich' },
    ]},
    { name: 'Spain', flag: '🇪🇸', cc: 'es', cities: [
      { code: 'BCN', city: 'Barcelona' },
      { code: 'MAD', city: 'Madrid' },
    ]},
    { name: 'Netherlands', flag: '🇳🇱', cc: 'nl', cities: [
      { code: 'AMS', city: 'Amsterdam' },
    ]},
    { name: 'Turkey', flag: '🇹🇷', cc: 'tr', cities: [
      { code: 'IST', city: 'Istanbul' },
    ]},
  ],
  eastasia: [
    { name: 'Japan', flag: '🇯🇵', cc: 'jp', cities: [
      { code: 'NRT', city: 'Tokyo' },
      { code: 'HND', city: 'Tokyo Haneda' },
      { code: 'KIX', city: 'Osaka' },
      { code: 'CTS', city: 'Sapporo' },
      { code: 'FUK', city: 'Fukuoka' },
      { code: 'OKA', city: 'Okinawa' },
    ]},
    { name: 'South Korea', flag: '🇰🇷', cc: 'kr', cities: [
      { code: 'ICN', city: 'Seoul' },
      { code: 'PUS', city: 'Busan' },
    ]},
    { name: 'Hong Kong', flag: '🇭🇰', cc: 'hk', cities: [
      { code: 'HKG', city: 'Hong Kong' },
    ]},
    { name: 'China', flag: '🇨🇳', cc: 'cn', cities: [
      { code: 'PVG', city: 'Shanghai' },
      { code: 'PEK', city: 'Beijing' },
    ]},
  ],
  southasia: [
    { name: 'Maldives', flag: '🇲🇻', cc: 'mv', cities: [
      { code: 'MLE', city: 'Malé' },
    ]},
    { name: 'Sri Lanka', flag: '🇱🇰', cc: 'lk', cities: [
      { code: 'CMB', city: 'Colombo' },
    ]},
    { name: 'Nepal', flag: '🇳🇵', cc: 'np', cities: [
      { code: 'KTM', city: 'Kathmandu' },
    ]},
    { name: 'Bangladesh', flag: '🇧🇩', cc: 'bd', cities: [
      { code: 'DAC', city: 'Dhaka' },
    ]},
    { name: 'Myanmar', flag: '🇲🇲', cc: 'mm', cities: [
      { code: 'RGN', city: 'Yangon' },
    ]},
  ],
  americas: [
    { name: 'USA', flag: '🇺🇸', cc: 'us', cities: [
      { code: 'JFK', city: 'New York' },
      { code: 'EWR', city: 'Newark' },
      { code: 'LAX', city: 'Los Angeles' },
      { code: 'SFO', city: 'San Francisco' },
      { code: 'ORD', city: 'Chicago' },
      { code: 'IAD', city: 'Washington DC' },
    ]},
    { name: 'Canada', flag: '🇨🇦', cc: 'ca', cities: [
      { code: 'YYZ', city: 'Toronto' },
      { code: 'YVR', city: 'Vancouver' },
    ]},
  ],
  oceania: [
    { name: 'Australia', flag: '🇦🇺', cc: 'au', cities: [
      { code: 'SYD', city: 'Sydney' },
      { code: 'MEL', city: 'Melbourne' },
      { code: 'BNE', city: 'Brisbane' },
      { code: 'PER', city: 'Perth' },
      { code: 'ADL', city: 'Adelaide' },
      { code: 'OOL', city: 'Gold Coast' },
    ]},
    { name: 'New Zealand', flag: '🇳🇿', cc: 'nz', cities: [
      { code: 'AKL', city: 'Auckland' },
      { code: 'CHC', city: 'Christchurch' },
    ]},
  ],
};

// Flat array per region — backward compatible with anything that used DESTINATIONS
export const DESTINATIONS = Object.fromEntries(
  Object.entries(COUNTRIES).map(([id, countries]) => [
    id,
    countries.flatMap(c => c.cities.map(city => ({ ...city, countryFlag: c.flag, countryName: c.name }))),
  ])
);

// Flat code → city lookup
export const ALL_DEST_MAP = Object.fromEntries(
  Object.values(DESTINATIONS).flat().map(d => [d.code, d.city])
);
