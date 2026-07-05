// 12-question taste quiz. Each option contributes weights to genres and moods,
// which the recommender turns into a preference vector. `weight` scales impact.

export const QUIZ = [
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
]
