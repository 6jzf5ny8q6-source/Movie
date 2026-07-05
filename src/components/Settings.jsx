import { useState } from 'react'
import { REGIONS, detectRegion, regionName } from '../lib/region.js'

// Settings: the global IMDb rating filter, default number of recommendations,
// streaming region, optional API keys for live updates, and data management.
export default function Settings({ settings, onPatch, onReset, onRetakeQuiz, onReplayIntro }) {
  const [tmdbKey, setTmdbKey] = useState(settings.tmdbKey)
  const [omdbKey, setOmdbKey] = useState(settings.omdbKey)
  const detected = detectRegion()

  return (
    <section className="settings">
      <h2>Settings</h2>

      <div className="setting">
        <div className="setting__text">
          <h3>Rating systems</h3>
          <p>Choose which review scores CineMatch uses to filter and rank. Turn
            one off to hide its badge and stop filtering by it.</p>
        </div>
        <div className="setting__control setting__control--toggles">
          <button
            className={`toggle ${settings.useImdb ? 'is-on' : ''}`}
            onClick={() => onPatch({ useImdb: !settings.useImdb })}
            aria-pressed={settings.useImdb}
          >
            <span className="toggle__dot" /> IMDb
          </button>
          <button
            className={`toggle ${settings.useRt ? 'is-on' : ''}`}
            onClick={() => onPatch({ useRt: !settings.useRt })}
            aria-pressed={settings.useRt}
          >
            <span className="toggle__dot" /> 🍅 Rotten Tomatoes
          </button>
        </div>
      </div>

      <div className={`setting ${settings.useImdb ? '' : 'setting--disabled'}`}>
        <div className="setting__text">
          <h3>Minimum IMDb rating</h3>
          <p>Only recommend titles rated at or above this IMDb score.</p>
        </div>
        <div className="setting__control">
          <input
            type="range"
            min="0"
            max="9.5"
            step="0.1"
            value={settings.minImdb}
            disabled={!settings.useImdb}
            onChange={(e) => onPatch({ minImdb: Number(e.target.value) })}
          />
          <span className="setting__value">{settings.minImdb.toFixed(1)}</span>
        </div>
      </div>

      <div className={`setting ${settings.useRt ? '' : 'setting--disabled'}`}>
        <div className="setting__text">
          <h3>Minimum Rotten Tomatoes score</h3>
          <p>Only recommend titles with a Tomatometer at or above this percent.</p>
        </div>
        <div className="setting__control">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={settings.minRt}
            disabled={!settings.useRt}
            onChange={(e) => onPatch({ minRt: Number(e.target.value) })}
          />
          <span className="setting__value">{settings.minRt}%</span>
        </div>
      </div>

      <div className="setting">
        <div className="setting__text">
          <h3>Recommendations per category</h3>
          <p>How many movies and shows to show before “show more”.</p>
        </div>
        <div className="setting__control">
          <input
            type="range"
            min="3"
            max="20"
            step="1"
            value={settings.prefLimit}
            onChange={(e) => onPatch({ prefLimit: Number(e.target.value) })}
          />
          <span className="setting__value">{settings.prefLimit}</span>
        </div>
      </div>

      <div className="setting">
        <div className="setting__text">
          <h3>Your region</h3>
          <p>
            Used to check whether a title is streaming where you are, and on
            which service. “Auto-detect” uses your browser’s locale
            {settings.region === 'auto' ? ` (detected: ${regionName(detected)})` : ''}.
          </p>
        </div>
        <div className="setting__control">
          <select
            value={settings.region}
            onChange={(e) => onPatch({ region: e.target.value })}
          >
            <option value="auto">Auto-detect ({detected})</option>
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="setting setting--block">
        <div className="setting__text">
          <h3>Live updates (optional)</h3>
          <p>
            Add a free{' '}
            <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer">TMDB API key</a>{' '}
            to pull in titles from across all years (ranked to your taste), each
            with its real streaming service and a watch link for your region. Add an{' '}
            <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noreferrer">OMDb key</a>{' '}
            to enrich them with true IMDb ratings and Rotten Tomatoes scores. Keys are stored only in your browser.
          </p>
        </div>
        <div className="setting__keys">
          <label>
            TMDB API key
            <input
              type="password"
              value={tmdbKey}
              placeholder="e.g. 8a1b…"
              onChange={(e) => setTmdbKey(e.target.value)}
              onBlur={() => onPatch({ tmdbKey: tmdbKey.trim() })}
            />
          </label>
          <label>
            OMDb API key
            <input
              type="password"
              value={omdbKey}
              placeholder="optional"
              onChange={(e) => setOmdbKey(e.target.value)}
              onBlur={() => onPatch({ omdbKey: omdbKey.trim() })}
            />
          </label>
        </div>
      </div>

      <div className="setting setting--actions">
        <button className="btn btn--outline" onClick={onRetakeQuiz}>Retake taste quiz</button>
        <button className="btn btn--outline" onClick={onReplayIntro}>Replay intro cartoon</button>
        <button className="btn btn--danger" onClick={onReset}>Reset all data</button>
      </div>
    </section>
  )
}
