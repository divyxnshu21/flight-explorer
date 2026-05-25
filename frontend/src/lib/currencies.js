export const CURRENCIES = [
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee'  },
  { code: 'USD', symbol: '$',   name: 'US Dollar'     },
  { code: 'EUR', symbol: '€',   name: 'Euro'          },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham'    },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen'  },
];

export function getCurrency(code) {
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0];
}

// INR → Indian notation (1,23,456); everything else → standard (1,234,567)
export function formatPrice(n, code = 'INR') {
  const v = Math.round(n);
  if (code === 'INR') {
    const s = v.toString();
    if (s.length <= 3) return s;
    const last3 = s.slice(-3);
    const rest  = s.slice(0, -3);
    return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  return v.toLocaleString('en-US');
}
