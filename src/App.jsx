import { useEffect, useMemo, useRef, useState } from 'react'
import { CATALOG, SERVICES } from './data/catalog.js'
import { store, titleKey } from './lib/storage.js'
import { buildProfileFromQuiz, buildTasteProfile, pickSeeds } from './lib/recommender.js'
import { fetchLiveCatalog, enrichProviders, enrichWithImdb, fetchSeedRecommendations } from './lib/tmdb.js'
import { resolveRegion } from './lib/region.js'
import { SHARED_URL, expandShared, mergeCatalog, graphFrom } from './lib/shared.js'

import IntroAnimation from './components/IntroAnimation.jsx'
import Quiz from './components/Quiz.jsx'
import Discover from './components/Discover.jsx'
import Ratings from './components/Ratings.jsx'
import Watchlist from './components/Watchlist.jsx'
import Insights from './components/Insights.jsx'
import Removed from './components/Removed.jsx'
import Settings from './components/Settings.jsx'
import RatingModal from './components/RatingModal.jsx'

const NAV = [
  { id: 'discover', label: 'Discover', icon: '✦' },
  { id: 'ratings', label: 'My Ratings', icon: '★' },
  { id: 'watchlist', label: 'Watchlist', icon: '＋' },
  { id: 'insights', label: 'Insights', icon: '📊' },
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
    imdbId: item.imdbId,
    _tmdbId: item._tmdbId,
    _tmdbType: item._tmdbType,
  }
}

export default function App() {
  const initial = store.getAll()
  const [showIntro, setShowIntro] = useState(true) // plays on every open
  // First-ever visit lands on the quiz; every visit after that opens on Discover.
  const [view, setView] = useState(initial.onboarded ? 'discover' : 'quiz')

  const [profile, setProfile] = useState(initial.profile)
  const [ratings, setRatings] = useState(initial.ratings)
  const [removed, setRemoved] = useState(initial.removed)
  const [settings, setSettings] = useState(initial.settings)
  const [watchlist, setWatchlist] = useState(initial.watchlist)
  // Start from the cached online catalog so a stored TMDB key keeps working
  // across visits without pressing "Get fresh titles" every time.
  const [liveItems, setLiveItems] = useState(() => initial.liveCache?.items || [])
  const [liveGraph, setLiveGraph] = useState(() => initial.liveCache?.graph || {})
  const [live, setLive] = useState({ loading: false, message: '', error: false })
  const autoFetched = useRef(false)
  const [feedback, setFeedback] = useState(initial.feedback || {})
  // Shared library everyone gets for free (built daily by a GitHub Action).
  const [shared, setShared] = useState(null)
  useEffect(() => {
    let cancelled = false
    fetch(SHARED_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (!cancelled && json?.items?.length) setShared(json) })
      .catch(() => { /* offline or not published yet: the built-in catalog still works */ })
    return () => { cancelled = true }
  }, [])

  const [rateTarget, setRateTarget] = useState(null)
  const [toast, setToast] = useState('')

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const region = useMemo(() => resolveRegion(settings.region), [settings.region])

  // Built-in catalog, then the shared library (region-accurate streaming +
  // "people also watched" links), then the user's own live fetches on top.
  const catalog = useMemo(
    () => mergeCatalog(CATALOG, expandShared(shared, region), liveItems),
    [shared, region, liveItems],
  )
  const graph = useMemo(() => graphFrom(catalog, liveGraph), [catalog, liveGraph])

  const services = useMemo(
    () => [...new Set(catalog.map((c) => c.service).filter((s) => s && !s.startsWith('Not on')))].sort(),
    [catalog],
  )

  // Taste learns from the quiz, ratings, AND everyday actions (hide, save, 👍).
  const taste = useMemo(
    () => buildTasteProfile(profile, ratings, { removed, watchlist, feedback }),
    [profile, ratings, removed, watchlist, feedback],
  )
  const seeds = useMemo(() => pickSeeds(ratings, feedback), [ratings, feedback])

  // ---- 👍 more like this ----
  const toggleLike = (item) => {
    const key = titleKey(item)
    const next = { ...feedback }
    if (next[key]) { delete next[key]; flash('Removed from your likes') }
    else { next[key] = { ...snapshot(item), vote: 1, at: Date.now() }; flash(`Got it — more like “${item.title}”`) }
    setFeedback(next)
    store.set('feedback', next)
  }

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
    setLive({ loading: true, message: 'Fetching titles matched to your taste…', error: false })
    try {
      // Bias the pool toward the user's favorite genres (across all years).
      const topGenres = Object.entries(taste.genres || {})
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([g]) => g)

      let items = await fetchLiveCatalog(settings.tmdbKey, { genres: topGenres })
      // Real streaming location in the user's region, then true IMDb/RT if keyed.
      items = await enrichProviders(items, settings.tmdbKey, region)
      // "Because you loved ___": what viewers of your favourites actually watch.
      const seedRecs = await fetchSeedRecommendations(settings.tmdbKey, seeds).catch(() => ({ items: [], graph: {} }))
      const seedItems = await enrichProviders(seedRecs.items, settings.tmdbKey, region)
      items = await enrichWithImdb(mergeCatalog(items, seedItems), settings.omdbKey)
      setLiveItems(items)
      setLiveGraph(seedRecs.graph)
      store.set('liveCache', { items, graph: seedRecs.graph, fetchedAt: Date.now() }) // survive reloads
      setLive({ loading: false, message: `Loaded ${items.length} titles for ${region}, ranked to your taste.`, error: false })
    } catch (err) {
      setLive({ loading: false, message: err.message || 'Could not fetch updates.', error: true })
    }
  }

  // With a TMDB key stored, keep the online catalog active automatically:
  // fetch on open when there's no cache yet or it's older than 24 hours.
  useEffect(() => {
    if (autoFetched.current || !settings.tmdbKey) return
    const age = Date.now() - (initial.liveCache?.fetchedAt || 0)
    if (!liveItems.length || age > 24 * 60 * 60 * 1000) {
      autoFetched.current = true
      refreshLive()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.tmdbKey])

  // ---- quiz ----
  const completeQuiz = (answers) => {
    const built = buildProfileFromQuiz(answers)
    const next = { ...built, answers, completedAt: Date.now() }
    setProfile(next)
    store.set('profile', next)
    store.set('onboarded', true)
    setView('discover')
    flash('Taste profile updated ✦')
  }

  // Leaving the quiz (skip/cancel) still counts as onboarded, so we don't force
  // the quiz on every future visit.
  const leaveQuiz = () => {
    store.set('onboarded', true)
    setView('discover')
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

  // ---- import / export ----
  const exportData = () => {
    const data = store.getAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cinematch-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    flash('Backup exported')
  }

  const importData = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const s = store.importAll(parsed)
        setProfile(s.profile)
        setRatings(s.ratings)
        setRemoved(s.removed)
        setFeedback(s.feedback || {})
        setSettings(s.settings)
        setWatchlist(s.watchlist)
        setLiveItems([])
        setView('discover')
        flash('Backup imported ✓')
      } catch {
        flash('That file isn’t a valid CineMatch backup')
      }
    }
    reader.readAsText(file)
  }

  const resetAll = () => {
    if (!window.confirm('Reset your quiz, ratings, watchlist and settings?')) return
    const s = store.reset()
    setProfile(s.profile)
    setRatings(s.ratings)
    setRemoved(s.removed)
    setFeedback(s.feedback || {})
    setSettings(s.settings)
    setWatchlist(s.watchlist)
    setLiveItems([])
    setView('quiz') // reset returns the app to a fresh new-user experience
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
            region={region}
            live={live}
            onRate={openRate}
            onWatchlist={toggleWatchlist}
            onDismiss={dismiss}
            onLike={toggleLike}
            feedback={feedback}
            seeds={seeds}
            graph={graph}
            onSetMinImdb={(v) => patchSettings({ minImdb: v })}
            onSetMinRt={(v) => patchSettings({ minRt: v })}
            onSetServices={(v) => patchSettings({ services: v })}
            onPatchSettings={patchSettings}
            onRefreshLive={refreshLive}
            onTakeQuiz={retakeQuiz}
          />
        )}

        {view === 'ratings' && (
          <Ratings
            catalog={catalog}
            ratings={ratings}
            ratingPrefs={{ useImdb: settings.useImdb, useRt: settings.useRt }}
            region={region}
            onRate={openRate}
            onRemove={removeRating}
          />
        )}

        {view === 'watchlist' && (
          <Watchlist
            watchlist={watchlist}
            ratings={ratings}
            ratingPrefs={{ useImdb: settings.useImdb, useRt: settings.useRt }}
            region={region}
            onRate={openRate}
            onRemove={removeWatchlist}
            onBrowse={() => setView('discover')}
          />
        )}

        {view === 'insights' && (
          <Insights
            ratings={ratings}
            ratingPrefs={{ useImdb: settings.useImdb, useRt: settings.useRt }}
            onBrowse={() => setView('ratings')}
          />
        )}

        {view === 'removed' && (
          <Removed
            removed={removed}
            ratingPrefs={{ useImdb: settings.useImdb, useRt: settings.useRt }}
            region={region}
            onRestore={restore}
          />
        )}

        {view === 'quiz' && (
          <Quiz
            onComplete={completeQuiz}
            onCancel={leaveQuiz}
            cancelLabel={profile ? 'Cancel' : 'Skip for now'}
          />
        )}

        {view === 'settings' && (
          <Settings
            settings={settings}
            onPatch={patchSettings}
            onReset={resetAll}
            onRetakeQuiz={retakeQuiz}
            onReplayIntro={() => setShowIntro(true)}
            onExport={exportData}
            onImportFile={importData}
          />
        )}
      </main>

      <footer className="footer">
        <span>CineMatch · your taste, your list. Ratings &amp; preferences saved on this device.</span>
        <span className="footer__attr">
          This product uses the TMDB API but is not endorsed or certified by{' '}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDB</a>.
          Streaming availability data provided by{' '}
          <a href="https://www.justwatch.com/" target="_blank" rel="noreferrer">JustWatch</a>.
        </span>
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
