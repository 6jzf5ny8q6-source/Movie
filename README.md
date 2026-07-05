# 🎬 CineMatch

**Movie night, sorted.** CineMatch is a streaming taste‑quiz and AI‑powered
recommendation app. Answer a quick quiz, rate what you've watched, and get a
personalized shortlist of movies and TV shows worth your evening — filtered to
the IMDb rating you care about.

Every time you open the app, a hand‑built **5‑second 8‑bit cartoon** of a dad
and his 5‑year‑old daughter watching a movie together plays as the intro.

---

## Features

- **12‑question taste quiz** that builds a personal preference profile (genres +
  moods) and saves it on your device.
- **AI recommendation engine** — scores the catalog against your taste vector,
  learning from both the quiz *and* your own ratings. Recommendations show a
  short reason for every pick.
- **Minimum IMDb rating filter** — a global slider (on Discover and in Settings)
  so you only ever see titles above the score you set.
- **Rating & watch‑history system** — mark titles watched, rate them 1–10, and
  flag "would watch again." Loved titles pull similar recommendations up;
  disliked ones push them down.
- **5 + 5 by default, more on request** — Discover shows up to 5 movies and 5
  shows, each with a **Show 5 more** button. The default count is configurable
  in Settings.
- **Live updates from online services (optional)** — add a free
  [TMDB](https://www.themoviedb.org/settings/api) key to pull current trending /
  now‑playing / on‑the‑air titles, and an optional
  [OMDb](https://www.omdbapi.com/apikey.aspx) key to enrich them with true IMDb
  ratings. Works fully offline against a curated catalog when no keys are set.
- **Watchlist**, professional cinematic UI, and everything persisted locally in
  your browser.

## Tech

- React 18 + Vite
- No backend — all state lives in `localStorage`
- Recommendation logic is pure and unit‑tested (Vitest)
- The intro cartoon is rendered on a tiny 200×125 canvas, scaled up with
  pixelated rendering for a crisp retro look

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
npm test         # run the recommender unit tests
```

## How the recommendation engine works

1. The quiz turns each answer into weighted **genre** and **mood** contributions,
   producing a base taste vector.
2. Your ratings are folded in: a title you scored 10 (or flagged "watch again")
   pushes its genres/moods up; a title you scored low pushes them down.
3. Each candidate is scored by how strongly its genres/moods match your vector,
   with IMDb rating as a gentle tie‑breaker. Already‑rated titles are excluded,
   and the IMDb + service filters are applied.

See `src/lib/recommender.js` (and its tests in `recommender.test.js`).

## Project structure

```
src/
  App.jsx                 # app shell, state, routing between views
  components/
    IntroAnimation.jsx    # the 8-bit intro cartoon (canvas)
    Quiz.jsx              # taste quiz
    Discover.jsx          # recommendations + filters
    Ratings.jsx           # watch history / rating management
    Settings.jsx          # rating filter, limits, API keys
    RatingModal.jsx       # 1–10 rating + watch-again
    TitleCard.jsx         # movie/show card
    PixelPoster.jsx       # artwork / pixel poster placeholder
  lib/
    recommender.js        # scoring engine (pure, tested)
    storage.js            # localStorage persistence
    tmdb.js               # optional TMDB/OMDb live updates
  data/
    catalog.js            # curated offline catalog (real IMDb ratings)
    quizQuestions.js      # the 12 quiz questions
```

> Ratings and preferences are stored only in your browser (`localStorage`), and
> any API keys you enter never leave your device.
