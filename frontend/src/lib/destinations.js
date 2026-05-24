export const REGIONS = [
  { id: 'domestic', flag: '🇮🇳', name: 'India' },
  { id: 'seasia',   flag: '🌏',  name: 'SE Asia' },
  { id: 'me',       flag: '🌙',  name: 'Middle East' },
  { id: 'europe',   flag: '🇪🇺', name: 'Europe' },
  { id: 'eastasia', flag: '🎌',  name: 'East Asia' },
  { id: 'southasia',flag: '🏝️', name: 'South Asia' },
  { id: 'americas', flag: '🌎',  name: 'Americas' },
  { id: 'oceania',  flag: '🦘',  name: 'Oceania' },
];

// Region → Country → Cities (the source of truth)
export const COUNTRIES = {
  domestic: [
    { name: 'North India', flag: '🏔️', cities: [
      { code: 'DEL', city: 'Delhi' },
      { code: 'JAI', city: 'Jaipur' },
      { code: 'AMD', city: 'Ahmedabad' },
      { code: 'LKO', city: 'Lucknow' },
    ]},
    { name: 'South India', flag: '🌴', cities: [
      { code: 'BLR', city: 'Bengaluru' },
      { code: 'MAA', city: 'Chennai' },
      { code: 'HYD', city: 'Hyderabad' },
      { code: 'COK', city: 'Kochi' },
    ]},
    { name: 'West & East', flag: '🏙️', cities: [
      { code: 'BOM', city: 'Mumbai' },
      { code: 'GOI', city: 'Goa' },
      { code: 'CCU', city: 'Kolkata' },
      { code: 'IXZ', city: 'Andaman' },
    ]},
  ],
  seasia: [
    { name: 'Thailand', flag: '🇹🇭', cities: [
      { code: 'BKK', city: 'Bangkok' },
      { code: 'HKT', city: 'Phuket' },
      { code: 'CNX', city: 'Chiang Mai' },
      { code: 'USM', city: 'Koh Samui' },
      { code: 'KBV', city: 'Krabi' },
    ]},
    { name: 'Vietnam', flag: '🇻🇳', cities: [
      { code: 'SGN', city: 'Ho Chi Minh' },
      { code: 'HAN', city: 'Hanoi' },
      { code: 'DAD', city: 'Da Nang' },
      { code: 'CXR', city: 'Nha Trang' },
      { code: 'PQC', city: 'Phu Quoc' },
    ]},
    { name: 'Singapore', flag: '🇸🇬', cities: [
      { code: 'SIN', city: 'Singapore' },
    ]},
    { name: 'Malaysia', flag: '🇲🇾', cities: [
      { code: 'KUL', city: 'Kuala Lumpur' },
      { code: 'PEN', city: 'Penang' },
    ]},
    { name: 'Indonesia', flag: '🇮🇩', cities: [
      { code: 'DPS', city: 'Bali' },
      { code: 'CGK', city: 'Jakarta' },
      { code: 'LOP', city: 'Lombok' },
    ]},
    { name: 'Philippines', flag: '🇵🇭', cities: [
      { code: 'MNL', city: 'Manila' },
      { code: 'CEB', city: 'Cebu' },
      { code: 'BCD', city: 'Boracay' },
    ]},
    { name: 'Cambodia', flag: '🇰🇭', cities: [
      { code: 'PNH', city: 'Phnom Penh' },
      { code: 'REP', city: 'Siem Reap' },
    ]},
  ],
  me: [
    { name: 'UAE', flag: '🇦🇪', cities: [
      { code: 'DXB', city: 'Dubai' },
      { code: 'AUH', city: 'Abu Dhabi' },
      { code: 'SHJ', city: 'Sharjah' },
    ]},
    { name: 'Qatar', flag: '🇶🇦', cities: [
      { code: 'DOH', city: 'Doha' },
    ]},
    { name: 'Oman', flag: '🇴🇲', cities: [
      { code: 'MCT', city: 'Muscat' },
    ]},
    { name: 'Saudi Arabia', flag: '🇸🇦', cities: [
      { code: 'JED', city: 'Jeddah' },
      { code: 'RUH', city: 'Riyadh' },
    ]},
    { name: 'Kuwait', flag: '🇰🇼', cities: [
      { code: 'KWI', city: 'Kuwait City' },
    ]},
    { name: 'Bahrain', flag: '🇧🇭', cities: [
      { code: 'BAH', city: 'Manama' },
    ]},
  ],
  europe: [
    { name: 'UK', flag: '🇬🇧', cities: [
      { code: 'LHR', city: 'London' },
      { code: 'MAN', city: 'Manchester' },
      { code: 'BHX', city: 'Birmingham' },
    ]},
    { name: 'France', flag: '🇫🇷', cities: [
      { code: 'CDG', city: 'Paris' },
      { code: 'NCE', city: 'Nice' },
    ]},
    { name: 'Italy', flag: '🇮🇹', cities: [
      { code: 'FCO', city: 'Rome' },
      { code: 'MXP', city: 'Milan' },
      { code: 'VCE', city: 'Venice' },
    ]},
    { name: 'Switzerland', flag: '🇨🇭', cities: [
      { code: 'ZRH', city: 'Zurich' },
      { code: 'GVA', city: 'Geneva' },
    ]},
    { name: 'Germany', flag: '🇩🇪', cities: [
      { code: 'FRA', city: 'Frankfurt' },
      { code: 'MUC', city: 'Munich' },
    ]},
    { name: 'Spain', flag: '🇪🇸', cities: [
      { code: 'BCN', city: 'Barcelona' },
      { code: 'MAD', city: 'Madrid' },
    ]},
    { name: 'Netherlands', flag: '🇳🇱', cities: [
      { code: 'AMS', city: 'Amsterdam' },
    ]},
    { name: 'Turkey', flag: '🇹🇷', cities: [
      { code: 'IST', city: 'Istanbul' },
    ]},
  ],
  eastasia: [
    { name: 'Japan', flag: '🇯🇵', cities: [
      { code: 'NRT', city: 'Tokyo' },
      { code: 'HND', city: 'Tokyo Haneda' },
      { code: 'KIX', city: 'Osaka' },
      { code: 'CTS', city: 'Sapporo' },
      { code: 'FUK', city: 'Fukuoka' },
      { code: 'OKA', city: 'Okinawa' },
    ]},
    { name: 'South Korea', flag: '🇰🇷', cities: [
      { code: 'ICN', city: 'Seoul' },
      { code: 'PUS', city: 'Busan' },
    ]},
    { name: 'Hong Kong', flag: '🇭🇰', cities: [
      { code: 'HKG', city: 'Hong Kong' },
    ]},
    { name: 'China', flag: '🇨🇳', cities: [
      { code: 'PVG', city: 'Shanghai' },
      { code: 'PEK', city: 'Beijing' },
    ]},
  ],
  southasia: [
    { name: 'Maldives', flag: '🇲🇻', cities: [
      { code: 'MLE', city: 'Malé' },
    ]},
    { name: 'Sri Lanka', flag: '🇱🇰', cities: [
      { code: 'CMB', city: 'Colombo' },
    ]},
    { name: 'Nepal', flag: '🇳🇵', cities: [
      { code: 'KTM', city: 'Kathmandu' },
    ]},
    { name: 'Bangladesh', flag: '🇧🇩', cities: [
      { code: 'DAC', city: 'Dhaka' },
    ]},
    { name: 'Myanmar', flag: '🇲🇲', cities: [
      { code: 'RGN', city: 'Yangon' },
    ]},
  ],
  americas: [
    { name: 'USA', flag: '🇺🇸', cities: [
      { code: 'JFK', city: 'New York' },
      { code: 'EWR', city: 'Newark' },
      { code: 'LAX', city: 'Los Angeles' },
      { code: 'SFO', city: 'San Francisco' },
      { code: 'ORD', city: 'Chicago' },
      { code: 'IAD', city: 'Washington DC' },
    ]},
    { name: 'Canada', flag: '🇨🇦', cities: [
      { code: 'YYZ', city: 'Toronto' },
      { code: 'YVR', city: 'Vancouver' },
    ]},
  ],
  oceania: [
    { name: 'Australia', flag: '🇦🇺', cities: [
      { code: 'SYD', city: 'Sydney' },
      { code: 'MEL', city: 'Melbourne' },
      { code: 'BNE', city: 'Brisbane' },
      { code: 'PER', city: 'Perth' },
      { code: 'ADL', city: 'Adelaide' },
      { code: 'OOL', city: 'Gold Coast' },
    ]},
    { name: 'New Zealand', flag: '🇳🇿', cities: [
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
