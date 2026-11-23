// Region helpers for streaming availability. The user's region decides which
// country's streaming providers we check on TMDB. "Auto" detects the region
// from the browser locale (no permissions needed) and falls back to the
// timezone, then to the US.

export const REGIONS = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ZA', name: 'South Africa' },
]

const REGION_CODES = new Set(REGIONS.map((r) => r.code))

const TZ_HINTS = [
  ['Europe/London', 'GB'], ['Europe/Dublin', 'IE'], ['Europe/Berlin', 'DE'],
  ['Europe/Paris', 'FR'], ['Europe/Madrid', 'ES'], ['Europe/Rome', 'IT'],
  ['Europe/Amsterdam', 'NL'], ['Europe/Stockholm', 'SE'], ['Europe/Oslo', 'NO'],
  ['Europe/Copenhagen', 'DK'], ['Europe/Helsinki', 'FI'], ['Asia/Kolkata', 'IN'],
  ['Asia/Tokyo', 'JP'], ['Asia/Seoul', 'KR'], ['Australia/', 'AU'],
  ['Pacific/Auckland', 'NZ'], ['America/Sao_Paulo', 'BR'], ['America/Mexico', 'MX'],
  ['America/Toronto', 'CA'], ['America/Vancouver', 'CA'], ['Africa/Johannesburg', 'ZA'],
]

// Best-effort region detection from the browser, no permission prompt.
export function detectRegion() {
  try {
    const langs = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || []
    for (const l of langs) {
      const m = String(l).match(/[-_]([A-Za-z]{2})$/)
      if (m && REGION_CODES.has(m[1].toUpperCase())) return m[1].toUpperCase()
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    for (const [hint, code] of TZ_HINTS) if (tz.startsWith(hint)) return code
    if (tz.startsWith('America/')) return 'US'
  } catch {
    /* ignore */
  }
  return 'US'
}

// Resolve the stored setting ('auto' or a code) to a concrete region code.
export function resolveRegion(setting) {
  if (!setting || setting === 'auto') return detectRegion()
  return REGION_CODES.has(setting) ? setting : 'US'
}

export function regionName(code) {
  return REGIONS.find((r) => r.code === code)?.name || code
}

// Fallback "where to watch" link (a JustWatch region search) for titles that
// don't carry a TMDB provider deep-link.
export function watchSearchUrl(title, region) {
  const r = (region || 'US').toLowerCase()
  return `https://www.justwatch.com/${r}/search?q=${encodeURIComponent(title)}`
}
