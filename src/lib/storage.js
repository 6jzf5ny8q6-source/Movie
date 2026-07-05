// Thin, versioned localStorage layer. All CineMatch state lives under one
// namespace so it is easy to inspect, migrate, or clear.

const NS = 'cinematch.v1'

const DEFAULTS = {
  profile: null,          // { genres:{}, moods:{}, answers:{}, completedAt }
  ratings: {},            // key -> { key, title, type, rating, watchAgain, genres, moods, ratedAt }
  settings: {
    minImdb: 7.0,
    tmdbKey: '',
    omdbKey: '',
    prefLimit: 5,         // recommendations per category before "show more"
    services: [],         // optional service filter (empty = all)
  },
  watchlist: {},          // key -> item snapshot
}

function read() {
  try {
    const raw = localStorage.getItem(NS)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULTS,
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function write(state) {
  try {
    localStorage.setItem(NS, JSON.stringify(state))
  } catch {
    /* storage full or unavailable — fail silently */
  }
}

export const store = {
  getAll: read,

  get(key) {
    return read()[key]
  },

  set(key, value) {
    const s = read()
    s[key] = value
    write(s)
    return s
  },

  patchSettings(patch) {
    const s = read()
    s.settings = { ...s.settings, ...patch }
    write(s)
    return s.settings
  },

  upsertRating(rating) {
    const s = read()
    s.ratings = { ...s.ratings, [rating.key]: rating }
    write(s)
    return s.ratings
  },

  removeRating(key) {
    const s = read()
    const { [key]: _, ...rest } = s.ratings
    s.ratings = rest
    write(s)
    return s.ratings
  },

  reset() {
    write({ ...DEFAULTS })
    return read()
  },
}

// Stable key for a title so external + local titles dedupe consistently.
export function titleKey(item) {
  return `${item.type}:${item.title.toLowerCase().trim()}:${item.year || ''}`
}
