import { useMemo, useState } from 'react'
import { CATALOG, SERVICES } from './data/catalog.js'
import { store, titleKey } from './lib/storage.js'
import { buildProfileFromQuiz, buildTasteProfile } from './lib/recommender.js'
import { fetchLiveCatalog, enrichWithImdb } from './lib/tmdb.js'

import IntroAnimation from './components/IntroAnimation.jsx'
import Quiz from './components/Quiz.jsx'
import Discover from './components/Discover.jsx'
import Ratings from './components/Ratings.jsx'
import Settings from './components/Settings.jsx'
import RatingModal from './components/RatingModal.jsx'

const NAV = [
  { id: 'discover', label: 'Discover', icon: '✦' },
  { id: 'ratings', label: 'My Ratings', icon: '★' },
  { id: 'quiz', label: 'Taste Quiz', icon: '?' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function App() {
  const initial = store.getAll()
  const [showIntro, setShowIntro] = useState(true) // plays on every open
  const [view, setView] = useState(initial.profile ? 'discover' : 'discover')

  const [profile, setProfile] = useState(initial.profile)
  const [ratings, setRatings] = useState(initial.ratings)
  const [settings, setSettings] = useState(initial.settings)
  const [watchlist, setWatchlist] = useState(initial.watchlist)
  const [liveItems, setLiveItems] = useState([])
  const [live, setLive] = useState({ loading: false, message: '', error: false })

  const [rateTarget, setRateTarget] = useState(null)
  const [toast, setToast] = useState('')

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  // Merge bundled catalog with any live titles, live winning on dedupe.
  const catalog = useMemo(() => {
    const map = new Map()
    for (const item of [...liveItems, ...CATALOG]) {
      const k = titleKey(item)
      if (!map.has(k)) map.set(k, item)
    }
    return [...map.values()]
  }, [liveItems])

  const services = useMemo(
    () => [...new Set(catalog.map((c) => c.service))].sort(),
    [catalog],
  )

  const taste = useMemo(() => buildTasteProfile(profile, ratings), [profile, ratings])

  // ---- ratings ----
  const openRate = (item) => setRateTarget(item)

  const saveRating = ({ rating, watchAgain }) => {
    const item = rateTarget
    const key = titleKey(item)
    const record = {
      key,
      title: item.title,
      type: item.type,
      year: item.year,
      genres: item.genres || [],
      moods: item.moods || [],
      imdb: item.imdb || 0,
      service: item.service,
      poster: item.poster,
      image: item.image || null,
      overview: item.overview || '',
      rating,
      watchAgain,
      ratedAt: Date.now(),
    }
    setRatings(store.upsertRating(record))
    setRateTarget(null)
    flash(`Saved “${item.title}” — ${rating}/10`)
  }

  const removeRating = (item) => {
    setRatings(store.removeRating(item.key || titleKey(item)))
    flash('Rating removed')
  }

  // ---- watchlist ----
  const toggleWatchlist = (item) => {
    const key = titleKey(item)
    const next = { ...watchlist }
    if (next[key]) { delete next[key]; flash('Removed from watchlist') }
    else { next[key] = { title: item.title, type: item.type }; flash('Added to watchlist') }
    setWatchlist(next)
    store.set('watchlist', next)
  }

  // ---- settings ----
  const patchSettings = (patch) => setSettings(store.patchSettings(patch))

  // ---- live updates ----
  const refreshLive = async () => {
    if (!settings.tmdbKey) {
      setLive({ loading: false, message: 'Add a TMDB key in Settings to fetch fresh titles.', error: true })
      return
    }
    setLive({ loading: true, message: 'Fetching current titles…', error: false })
    try {
      let items = await fetchLiveCatalog(settings.tmdbKey)
      items = await enrichWithImdb(items, settings.omdbKey)
      setLiveItems(items)
      setLive({ loading: false, message: `Loaded ${items.length} fresh titles.`, error: false })
    } catch (err) {
      setLive({ loading: false, message: err.message || 'Could not fetch updates.', error: true })
    }
  }

  // ---- quiz ----
  const completeQuiz = (answers) => {
    const built = buildProfileFromQuiz(answers)
    const next = { ...built, answers, completedAt: Date.now() }
    setProfile(next)
    store.set('profile', next)
    setView('discover')
    flash('Taste profile updated ✦')
  }

  const resetAll = () => {
    if (!window.confirm('Reset your quiz, ratings, watchlist and settings?')) return
    const s = store.reset()
    setProfile(s.profile)
    setRatings(s.ratings)
    setSettings(s.settings)
    setWatchlist(s.watchlist)
    setLiveItems([])
    setView('discover')
    flash('All data reset')
  }

  return (
    <div className="app">
      {showIntro && <IntroAnimation onDone={() => setShowIntro(false)} />}

      <header className="topbar">
        <div className="brand" onClick={() => setView('discover')}>
          <span className="brand__mark">▶</span>
          <span className="brand__name">CineMatch</span>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav__item ${view === n.id ? 'is-active' : ''}`}
              onClick={() => setView(n.id)}
            >
              <span className="nav__icon">{n.icon}</span>
              <span className="nav__label">{n.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {view === 'discover' && (
          <Discover
            catalog={catalog}
            taste={taste}
            ratings={ratings}
            settings={settings}
            watchlist={watchlist}
            hasProfile={Boolean(profile)}
            services={services}
            live={live}
            onRate={openRate}
            onWatchlist={toggleWatchlist}
            onSetMinImdb={(v) => patchSettings({ minImdb: v })}
            onSetServices={(v) => patchSettings({ services: v })}
            onRefreshLive={refreshLive}
            onTakeQuiz={() => setView('quiz')}
          />
        )}

        {view === 'ratings' && (
          <Ratings
            catalog={catalog}
            ratings={ratings}
            onRate={openRate}
            onRemove={removeRating}
          />
        )}

        {view === 'quiz' && (
          <Quiz
            initialAnswers={profile?.answers}
            onComplete={completeQuiz}
            onCancel={() => setView('discover')}
          />
        )}

        {view === 'settings' && (
          <Settings
            settings={settings}
            onPatch={patchSettings}
            onReset={resetAll}
            onRetakeQuiz={() => setView('quiz')}
            onReplayIntro={() => setShowIntro(true)}
          />
        )}
      </main>

      <footer className="footer">
        <span>CineMatch · your taste, your list. Ratings &amp; preferences saved on this device.</span>
      </footer>

      {rateTarget && (
        <RatingModal
          item={rateTarget}
          existing={ratings[titleKey(rateTarget)]}
          onSave={saveRating}
          onClose={() => setRateTarget(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
