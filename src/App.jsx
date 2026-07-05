import { useMemo, useState } from 'react'
import { CATALOG, SERVICES } from './data/catalog.js'
import { store, titleKey } from './lib/storage.js'
import { buildProfileFromQuiz, buildTasteProfile } from './lib/recommender.js'
import { fetchLiveCatalog, enrichWithImdb } from './lib/tmdb.js'

import IntroAnimation from './components/IntroAnimation.jsx'
import Quiz from './components/Quiz.jsx'
import Discover from './components/Discover.jsx'
import Ratings from './components/Ratings.jsx'
import Watchlist from './components/Watchlist.jsx'
import Removed from './components/Removed.jsx'
import Settings from './components/Settings.jsx'
import RatingModal from './components/RatingModal.jsx'

const NAV = [
  { id: 'discover', label: 'Discover', icon: '✦' },
  { id: 'ratings', label: 'My Ratings', icon: '★' },
  { id: 'watchlist', label: 'Watchlist', icon: '＋' },
  { id: 'removed', label: 'Not Interested', icon: '✕' },
  { id: 'quiz', label: 'Taste Quiz', icon: '?' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

// Build a full snapshot of a title so any list can display + sort it later.
function snapshot(item) {
  return {
    key: titleKey(item),
    title: item.title,
    type: item.type,
    year: item.year,
    genres: item.genres || [],
    moods: item.moods || [],
    imdb: item.imdb || 0,
    rt: item.rt ?? null,
    service: item.service,
    poster: item.poster,
    image: item.image || null,
    overview: item.overview || '',
  }
}

export default function App() {
  const initial = store.getAll()
  const [showIntro, setShowIntro] = useState(true) // plays on every open
  const [view, setView] = useState(initial.profile ? 'discover' : 'discover')

  const [profile, setProfile] = useState(initial.profile)
  const [ratings, setRatings] = useState(initial.ratings)
  const [removed, setRemoved] = useState(initial.removed)
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
    const record = { ...snapshot(item), rating, watchAgain, ratedAt: Date.now() }
    setRatings(store.upsertRating(record))
    // Once watched + rated, it no longer belongs on the watchlist.
    if (watchlist[key]) {
      const next = { ...watchlist }
      delete next[key]
      setWatchlist(next)
      store.set('watchlist', next)
    }
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
    else { next[key] = { ...snapshot(item), addedAt: Date.now() }; flash(`Added “${item.title}” to watchlist`) }
    setWatchlist(next)
    store.set('watchlist', next)
  }

  const removeWatchlist = (item) => {
    const key = item.key || titleKey(item)
    const next = { ...watchlist }
    delete next[key]
    setWatchlist(next)
    store.set('watchlist', next)
    flash('Removed from watchlist')
  }

  // ---- dismissed recommendations ----
  const dismiss = (item) => {
    const key = titleKey(item)
    setRemoved(store.addRemoved(key, snapshot(item)))
    flash(`Hidden “${item.title}” — find it under Not Interested`)
  }

  const restore = (item) => {
    setRemoved(store.restoreRemoved(item.key || titleKey(item)))
    flash(`“${item.title}” back in recommendations`)
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

  // Start a fresh quiz: wipe the stored past answers so nothing carries over
  // (the quiz also draws a brand-new set of questions each time).
  const retakeQuiz = () => {
    if (profile?.answers) {
      const cleared = { ...profile, answers: {} }
      setProfile(cleared)
      store.set('profile', cleared)
    }
    setView('quiz')
  }

  const resetAll = () => {
    if (!window.confirm('Reset your quiz, ratings, watchlist and settings?')) return
    const s = store.reset()
    setProfile(s.profile)
    setRatings(s.ratings)
    setRemoved(s.removed)
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
              onClick={() => (n.id === 'quiz' ? retakeQuiz() : setView(n.id))}
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
            removed={removed}
            settings={settings}
            watchlist={watchlist}
            hasProfile={Boolean(profile)}
            services={services}
            live={live}
            onRate={openRate}
            onWatchlist={toggleWatchlist}
            onDismiss={dismiss}
            onSetMinImdb={(v) => patchSettings({ minImdb: v })}
            onSetMinRt={(v) => patchSettings({ minRt: v })}
            onSetServices={(v) => patchSettings({ services: v })}
            onRefreshLive={refreshLive}
            onTakeQuiz={retakeQuiz}
          />
        )}

        {view === 'ratings' && (
          <Ratings
            catalog={catalog}
            ratings={ratings}
            ratingPrefs={{ useImdb: settings.useImdb, useRt: settings.useRt }}
            onRate={openRate}
            onRemove={removeRating}
          />
        )}

        {view === 'watchlist' && (
          <Watchlist
            watchlist={watchlist}
            ratings={ratings}
            ratingPrefs={{ useImdb: settings.useImdb, useRt: settings.useRt }}
            onRate={openRate}
            onRemove={removeWatchlist}
            onBrowse={() => setView('discover')}
          />
        )}

        {view === 'removed' && (
          <Removed
            removed={removed}
            ratingPrefs={{ useImdb: settings.useImdb, useRt: settings.useRt }}
            onRestore={restore}
          />
        )}

        {view === 'quiz' && (
          <Quiz
            onComplete={completeQuiz}
            onCancel={() => setView('discover')}
          />
        )}

        {view === 'settings' && (
          <Settings
            settings={settings}
            onPatch={patchSettings}
            onReset={resetAll}
            onRetakeQuiz={retakeQuiz}
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
