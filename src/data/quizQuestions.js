// Taste-quiz question bank. Each option contributes weights to genres and
// moods, which the recommender turns into a preference vector. `weight` scales
// impact. A quiz session draws a fresh randomized subset from this bank (see
// selectQuiz) so retaking the quiz asks a new set of questions.

export const QUIZ_BANK = [
  {
    id: 'q1',
    prompt: 'It’s Friday night. What are you in the mood for?',
    options: [
      { label: 'Something that makes me laugh', genres: ['Comedy'], moods: ['funny', 'feel-good'] },
      { label: 'An edge-of-my-seat thrill ride', genres: ['Thriller', 'Action'], moods: ['intense', 'suspenseful'] },
      { label: 'A story that moves me', genres: ['Drama', 'Romance'], moods: ['emotional', 'thought-provoking'] },
      { label: 'Pure escapism into another world', genres: ['Fantasy', 'Sci-Fi', 'Adventure'], moods: ['epic'] },
    ],
  },
  {
    id: 'q2',
    prompt: 'Which world would you most like to disappear into?',
    options: [
      { label: 'A gritty city of cops and criminals', genres: ['Crime', 'Thriller'], moods: ['dark', 'intense'] },
      { label: 'A galaxy far, far away', genres: ['Sci-Fi', 'Adventure'], moods: ['epic'] },
      { label: 'A kingdom of magic and dragons', genres: ['Fantasy', 'Adventure'], moods: ['epic'] },
      { label: 'A richly detailed moment in history', genres: ['Historical', 'Drama', 'War'], moods: ['thought-provoking'] },
    ],
  },
  {
    id: 'q3',
    prompt: 'How do you like your stories to feel?',
    options: [
      { label: 'Dark, morally complex, no easy answers', genres: ['Crime', 'Thriller'], moods: ['dark', 'thought-provoking'] },
      { label: 'Warm and uplifting', genres: ['Family', 'Comedy'], moods: ['feel-good', 'uplifting', 'cozy'] },
      { label: 'Bittersweet and emotional', genres: ['Drama', 'Romance'], moods: ['emotional', 'nostalgic'] },
      { label: 'Big, loud, and larger than life', genres: ['Action', 'Superhero'], moods: ['epic', 'intense'] },
    ],
  },
  {
    id: 'q4',
    prompt: 'Pick your ideal pace.',
    options: [
      { label: 'Fast and relentless', genres: ['Action', 'Thriller'], moods: ['intense', 'suspenseful'], weight: 1.2 },
      { label: 'A slow burn that rewards patience', genres: ['Drama', 'Mystery'], moods: ['thought-provoking', 'suspenseful'] },
      { label: 'Cozy and easy to sink into', genres: ['Comedy', 'Family'], moods: ['cozy', 'feel-good'] },
      { label: 'Whatever keeps me guessing', genres: ['Mystery', 'Thriller'], moods: ['suspenseful', 'mind-bending'] },
    ],
  },
  {
    id: 'q5',
    prompt: 'Which of these could you rewatch endlessly?',
    options: [
      { label: 'A clever heist or mystery', genres: ['Crime', 'Mystery'], moods: ['suspenseful', 'quirky'] },
      { label: 'A sweeping epic adventure', genres: ['Adventure', 'Fantasy'], moods: ['epic'] },
      { label: 'A sharp, witty comedy', genres: ['Comedy'], moods: ['funny', 'quirky'] },
      { label: 'A beautiful, tear-jerking drama', genres: ['Drama'], moods: ['emotional'] },
    ],
  },
  {
    id: 'q6',
    prompt: 'Do you like a story that makes you cry?',
    options: [
      { label: 'Absolutely — hit me in the heart', genres: ['Drama', 'Romance'], moods: ['emotional'], weight: 1.3 },
      { label: 'Sometimes, if it earns it', genres: ['Drama'], moods: ['emotional', 'thought-provoking'] },
      { label: 'I’d rather laugh than cry', genres: ['Comedy'], moods: ['funny', 'feel-good'] },
      { label: 'Keep it light — no waterworks', genres: ['Adventure', 'Family'], moods: ['feel-good', 'cozy'] },
    ],
  },
  {
    id: 'q7',
    prompt: 'What kind of humor lands for you?',
    options: [
      { label: 'Quirky and offbeat', genres: ['Comedy'], moods: ['quirky', 'funny'] },
      { label: 'Dry and satirical', genres: ['Comedy', 'Drama'], moods: ['funny', 'thought-provoking'] },
      { label: 'Feel-good and wholesome', genres: ['Family', 'Comedy'], moods: ['feel-good', 'uplifting'] },
      { label: 'Honestly, I’m here for the drama, not jokes', genres: ['Drama', 'Thriller'], moods: ['intense'] },
    ],
  },
  {
    id: 'q8',
    prompt: 'How do you feel about being scared?',
    options: [
      { label: 'Love it — the scarier the better', genres: ['Horror', 'Thriller'], moods: ['scary', 'intense'], weight: 1.3 },
      { label: 'A little suspense and dread is fun', genres: ['Thriller', 'Mystery'], moods: ['suspenseful'] },
      { label: 'Tension is fine, gore is not', genres: ['Thriller', 'Drama'], moods: ['suspenseful'] },
      { label: 'No thanks — keep me comfortable', genres: ['Comedy', 'Family'], moods: ['cozy', 'feel-good'] },
    ],
  },
  {
    id: 'q9',
    prompt: 'How much do you want to think while watching?',
    options: [
      { label: 'Give me a puzzle to untangle', genres: ['Mystery', 'Sci-Fi'], moods: ['mind-bending', 'thought-provoking'], weight: 1.2 },
      { label: 'Smart but not homework', genres: ['Drama', 'Thriller'], moods: ['thought-provoking'] },
      { label: 'Just enough to stay hooked', genres: ['Action', 'Adventure'], moods: ['suspenseful'] },
      { label: 'Switch my brain off, please', genres: ['Comedy', 'Action'], moods: ['feel-good', 'funny'] },
    ],
  },
  {
    id: 'q10',
    prompt: 'Which protagonist draws you in most?',
    options: [
      { label: 'A flawed anti-hero', genres: ['Crime', 'Drama'], moods: ['dark', 'thought-provoking'] },
      { label: 'A reluctant hero rising to the occasion', genres: ['Adventure', 'Superhero', 'Fantasy'], moods: ['epic', 'uplifting'] },
      { label: 'A sharp mind solving the unsolvable', genres: ['Mystery', 'Crime'], moods: ['suspenseful'] },
      { label: 'An ordinary person in an extraordinary bind', genres: ['Drama', 'Thriller'], moods: ['emotional', 'intense'] },
    ],
  },
  {
    id: 'q11',
    prompt: 'Epic scope or intimate story?',
    options: [
      { label: 'Epic — worlds, battles, destiny', genres: ['Fantasy', 'Sci-Fi', 'War'], moods: ['epic'], weight: 1.2 },
      { label: 'Intimate — a few people, deeply drawn', genres: ['Drama', 'Romance'], moods: ['emotional', 'cozy'] },
      { label: 'A bit of both', genres: ['Adventure', 'Drama'], moods: ['epic', 'emotional'] },
      { label: 'Whatever has the best twist', genres: ['Thriller', 'Mystery'], moods: ['suspenseful', 'mind-bending'] },
    ],
  },
  {
    id: 'q12',
    prompt: 'Last one — a genre you can never say no to?',
    options: [
      { label: 'Sci-Fi', genres: ['Sci-Fi'], moods: ['mind-bending', 'epic'], weight: 1.4 },
      { label: 'Crime & Thriller', genres: ['Crime', 'Thriller'], moods: ['dark', 'suspenseful'], weight: 1.4 },
      { label: 'Comedy', genres: ['Comedy'], moods: ['funny', 'feel-good'], weight: 1.4 },
      { label: 'Animation & Family', genres: ['Animation', 'Family'], moods: ['feel-good', 'cozy'], weight: 1.4 },
    ],
  },

  // ---- Additional questions (drawn into rotation on retake) ----
  {
    id: 'q13',
    prompt: 'How do you feel about subtitles and international films?',
    options: [
      { label: 'Love world cinema, subtitles and all', genres: ['Drama', 'Thriller'], moods: ['thought-provoking'] },
      { label: 'Happy to now and then', genres: ['Drama'], moods: ['thought-provoking', 'emotional'] },
      { label: 'Prefer English-language', genres: ['Action', 'Comedy'], moods: ['feel-good'] },
      { label: 'Don’t care as long as it’s good', genres: ['Adventure', 'Thriller'], moods: ['suspenseful'] },
    ],
  },
  {
    id: 'q14',
    prompt: 'True story or total fiction?',
    options: [
      { label: 'Based on real events', genres: ['Historical', 'Drama', 'Documentary'], moods: ['thought-provoking'] },
      { label: 'Pure fantasy escape', genres: ['Fantasy', 'Sci-Fi'], moods: ['epic'] },
      { label: 'A bit of both', genres: ['Drama', 'Adventure'], moods: ['emotional'] },
      { label: 'Whatever grips me', genres: ['Thriller', 'Mystery'], moods: ['suspenseful'] },
    ],
  },
  {
    id: 'q15',
    prompt: 'Where do you land on action and intensity?',
    options: [
      { label: 'Bring the explosions', genres: ['Action', 'War'], moods: ['intense', 'violent'], weight: 1.2 },
      { label: 'Some tension is great', genres: ['Thriller', 'Action'], moods: ['intense', 'suspenseful'] },
      { label: 'I prefer it low-key', genres: ['Drama', 'Romance'], moods: ['emotional', 'cozy'] },
      { label: 'Keep it gentle', genres: ['Family', 'Comedy'], moods: ['feel-good', 'cozy'] },
    ],
  },
  {
    id: 'q16',
    prompt: 'Pick a setting that pulls you in.',
    options: [
      { label: 'Outer space or the far future', genres: ['Sci-Fi'], moods: ['epic', 'mind-bending'] },
      { label: 'A vivid moment in the past', genres: ['Historical', 'Drama'], moods: ['nostalgic', 'thought-provoking'] },
      { label: 'The gritty present day', genres: ['Crime', 'Drama'], moods: ['dark', 'thought-provoking'] },
      { label: 'A magical realm', genres: ['Fantasy', 'Adventure'], moods: ['epic'] },
    ],
  },
  {
    id: 'q17',
    prompt: 'What hooks you into a story fastest?',
    options: [
      { label: 'A jaw-dropping twist', genres: ['Thriller', 'Mystery'], moods: ['mind-bending', 'suspenseful'] },
      { label: 'Characters I fall for', genres: ['Drama', 'Romance'], moods: ['emotional', 'thought-provoking'] },
      { label: 'Relentless momentum', genres: ['Action', 'Adventure'], moods: ['intense'] },
      { label: 'Sharp, clever humor', genres: ['Comedy'], moods: ['funny', 'quirky'] },
    ],
  },
  {
    id: 'q18',
    prompt: 'How much time do you like to commit?',
    options: [
      { label: 'A tight two-hour movie', genres: ['Thriller', 'Drama'], moods: ['suspenseful'] },
      { label: 'A binge-worthy series', genres: ['Drama', 'Crime'], moods: ['thought-provoking', 'dark'] },
      { label: 'Light, easy episodes', genres: ['Comedy', 'Family'], moods: ['cozy', 'feel-good'] },
      { label: 'Sprawling epics I can live in', genres: ['Fantasy', 'Sci-Fi', 'Adventure'], moods: ['epic'] },
    ],
  },
  {
    id: 'q19',
    prompt: 'What matters most to your experience?',
    options: [
      { label: 'Jaw-dropping visuals', genres: ['Action', 'Sci-Fi', 'Adventure'], moods: ['epic'] },
      { label: 'A score that moves me', genres: ['Musical', 'Drama'], moods: ['emotional'] },
      { label: 'A story that makes me think', genres: ['Drama', 'Mystery'], moods: ['thought-provoking', 'mind-bending'] },
      { label: 'Laughs, first and foremost', genres: ['Comedy'], moods: ['funny', 'feel-good'] },
    ],
  },
  {
    id: 'q20',
    prompt: 'When the credits roll, you want to feel…',
    options: [
      { label: 'Uplifted and hopeful', genres: ['Family', 'Drama'], moods: ['uplifting', 'feel-good'] },
      { label: 'Shaken and thoughtful', genres: ['Thriller', 'Drama'], moods: ['dark', 'thought-provoking'] },
      { label: 'Thrilled and pumped up', genres: ['Action', 'Superhero'], moods: ['intense', 'epic'] },
      { label: 'Warm and cozy', genres: ['Comedy', 'Romance'], moods: ['cozy', 'romantic', 'feel-good'] },
    ],
  },
  {
    id: 'q21',
    prompt: 'Which kind of antagonist appeals most?',
    options: [
      { label: 'A brilliant criminal mastermind', genres: ['Crime', 'Thriller'], moods: ['dark', 'suspenseful'] },
      { label: 'A terrifying monster', genres: ['Horror'], moods: ['scary', 'intense'] },
      { label: 'A world-ending threat', genres: ['Sci-Fi', 'Superhero'], moods: ['epic', 'intense'] },
      { label: 'No villain — just real life', genres: ['Drama', 'Comedy'], moods: ['emotional', 'thought-provoking'] },
    ],
  },
  {
    id: 'q22',
    prompt: 'Your go-to comfort rewatch is…',
    options: [
      { label: 'A gripping thriller', genres: ['Thriller', 'Mystery'], moods: ['suspenseful'] },
      { label: 'A cozy sitcom', genres: ['Comedy'], moods: ['cozy', 'funny'] },
      { label: 'An animated favorite', genres: ['Animation', 'Family'], moods: ['feel-good', 'cozy'] },
      { label: 'A grand adventure', genres: ['Adventure', 'Fantasy'], moods: ['epic'] },
    ],
  },
  {
    id: 'q23',
    prompt: 'How dark are you willing to go?',
    options: [
      { label: 'Pitch black, no limits', genres: ['Horror', 'Crime', 'Thriller'], moods: ['dark', 'violent', 'scary'], weight: 1.2 },
      { label: 'Shadowy but not bleak', genres: ['Thriller', 'Mystery'], moods: ['dark', 'suspenseful'] },
      { label: 'Keep some light in it', genres: ['Drama', 'Adventure'], moods: ['emotional'] },
      { label: 'Bright and hopeful only', genres: ['Family', 'Comedy'], moods: ['feel-good', 'uplifting'] },
    ],
  },
  {
    id: 'q24',
    prompt: 'Desert-island genre pairing — pick one.',
    options: [
      { label: 'Sci-Fi + Adventure', genres: ['Sci-Fi', 'Adventure'], moods: ['epic', 'mind-bending'], weight: 1.3 },
      { label: 'Crime + Drama', genres: ['Crime', 'Drama'], moods: ['dark', 'thought-provoking'], weight: 1.3 },
      { label: 'Comedy + Romance', genres: ['Comedy', 'Romance'], moods: ['funny', 'romantic'], weight: 1.3 },
      { label: 'Horror + Mystery', genres: ['Horror', 'Mystery'], moods: ['scary', 'suspenseful'], weight: 1.3 },
    ],
  },
]

// Draw a fresh, randomized subset of the bank for one quiz session.
// The last slot is always a "signature" genre-pairing question for a satisfying
// finish; the rest are shuffled so a retake asks a new set.
export function selectQuiz(count = 12) {
  const signatures = QUIZ_BANK.filter((q) => q.id === 'q12' || q.id === 'q24')
  const rest = QUIZ_BANK.filter((q) => !signatures.includes(q))
  const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const finisher = shuffle(signatures)[0]
  const body = shuffle(rest).slice(0, Math.max(0, count - 1))
  return [...body, finisher]
}
