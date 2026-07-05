// Curated fallback catalog so CineMatch is fully functional offline.
// IMDb ratings are real (approximate, as of build). `mood` tags power the
// recommendation engine alongside genres. `poster` is a hex used to render a
// tasteful pixel-poster placeholder when no artwork is available online.

export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'Historical', 'Horror', 'Musical',
  'Mystery', 'Romance', 'Sci-Fi', 'Superhero', 'Thriller', 'War',
]

export const MOODS = [
  'feel-good', 'dark', 'funny', 'intense', 'thought-provoking', 'scary',
  'emotional', 'epic', 'cozy', 'mind-bending', 'suspenseful', 'romantic',
  'quirky', 'uplifting', 'violent', 'nostalgic',
]

let _id = 0
const T = (type) => (title, year, imdb, genres, moods, service, poster, overview) => ({
  id: `local-${++_id}`,
  source: 'local',
  type,
  title,
  year,
  imdb,
  genres,
  moods,
  service,
  poster,
  overview,
})
const movie = T('movie')
const show = T('show')

export const CATALOG = [
  // ---------- Movies ----------
  movie('The Shawshank Redemption', 1994, 9.3, ['Drama', 'Crime'], ['emotional', 'uplifting', 'thought-provoking'], 'Max', '#5b7c99', 'Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.'),
  movie('The Dark Knight', 2008, 9.0, ['Action', 'Crime', 'Superhero', 'Thriller'], ['dark', 'intense', 'epic'], 'Max', '#2b2f3a', 'Batman faces the Joker, a criminal mastermind who plunges Gotham into anarchy.'),
  movie('Inception', 2010, 8.8, ['Sci-Fi', 'Action', 'Thriller'], ['mind-bending', 'intense', 'epic'], 'Netflix', '#3a4a63', 'A thief who steals corporate secrets through dream-sharing tech is given the inverse task of planting an idea.'),
  movie('Parasite', 2019, 8.5, ['Drama', 'Thriller', 'Comedy'], ['dark', 'thought-provoking', 'suspenseful'], 'Hulu', '#7a6f5b', 'A poor family schemes to become employed by a wealthy household, with unforeseen consequences.'),
  movie('Interstellar', 2014, 8.7, ['Sci-Fi', 'Adventure', 'Drama'], ['epic', 'emotional', 'mind-bending'], 'Paramount+', '#33475e', 'Explorers travel through a wormhole in space in an attempt to ensure humanity’s survival.'),
  movie('Spider-Man: Into the Spider-Verse', 2018, 8.7, ['Animation', 'Action', 'Superhero', 'Adventure'], ['feel-good', 'epic', 'funny'], 'Netflix', '#a33d7a', 'Teen Miles Morales becomes Spider-Man and joins other Spider-People across the multiverse.'),
  movie('Whiplash', 2014, 8.5, ['Drama', 'Musical'], ['intense', 'thought-provoking', 'emotional'], 'Netflix', '#8a6d3b', 'A young drummer enrolls at a cutthroat music conservatory under a ruthless instructor.'),
  movie('Mad Max: Fury Road', 2015, 8.1, ['Action', 'Adventure', 'Sci-Fi'], ['intense', 'epic', 'violent'], 'Max', '#b5532a', 'In a post-apocalyptic wasteland, a woman rebels against a tyrant with the aid of a drifter.'),
  movie('La La Land', 2016, 8.0, ['Musical', 'Romance', 'Drama'], ['romantic', 'emotional', 'feel-good', 'nostalgic'], 'Hulu', '#3b5c8a', 'A jazz musician and an aspiring actress fall in love while pursuing their dreams in Los Angeles.'),
  movie('Get Out', 2017, 7.8, ['Horror', 'Thriller', 'Mystery'], ['scary', 'thought-provoking', 'suspenseful'], 'Peacock', '#6a3b3b', 'A young Black man uncovers a disturbing secret when he meets his white girlfriend’s family.'),
  movie('Coco', 2017, 8.4, ['Animation', 'Family', 'Musical', 'Fantasy'], ['emotional', 'feel-good', 'uplifting'], 'Disney+', '#c26a2a', 'A boy dreaming of becoming a musician journeys into the Land of the Dead to unlock his family’s history.'),
  movie('The Grand Budapest Hotel', 2014, 8.1, ['Comedy', 'Adventure', 'Drama'], ['quirky', 'funny', 'nostalgic'], 'Disney+', '#c98a9a', 'A legendary concierge and his protégé become embroiled in the theft of a priceless painting.'),
  movie('Everything Everywhere All at Once', 2022, 7.8, ['Sci-Fi', 'Comedy', 'Adventure'], ['mind-bending', 'funny', 'emotional', 'quirky'], 'Showtime', '#8a3b8a', 'A weary laundromat owner discovers she must connect with parallel-universe versions of herself.'),
  movie('Dune: Part Two', 2024, 8.5, ['Sci-Fi', 'Adventure', 'Action'], ['epic', 'intense', 'thought-provoking'], 'Max', '#b58a4a', 'Paul Atreides unites with the Fremen to wage war against those who destroyed his family.'),
  movie('Oppenheimer', 2023, 8.3, ['Drama', 'Historical', 'War'], ['intense', 'thought-provoking', 'dark'], 'Peacock', '#5a4a3a', 'The story of J. Robert Oppenheimer and his role in developing the atomic bomb.'),
  movie('Knives Out', 2019, 7.9, ['Comedy', 'Crime', 'Mystery'], ['funny', 'suspenseful', 'quirky'], 'Prime Video', '#3b6a5a', 'A detective investigates the death of a patriarch of an eccentric, combative family.'),
  movie('Spirited Away', 2001, 8.6, ['Animation', 'Fantasy', 'Adventure', 'Family'], ['epic', 'emotional', 'cozy'], 'Max', '#4a8a6a', 'A girl wanders into a world of spirits and must find a way to free herself and her parents.'),
  movie('The Social Network', 2010, 7.8, ['Drama', 'Historical'], ['thought-provoking', 'intense'], 'Netflix', '#3a5a6a', 'The founding of Facebook and the lawsuits that followed its meteoric rise.'),
  movie('John Wick', 2014, 7.4, ['Action', 'Crime', 'Thriller'], ['intense', 'violent', 'suspenseful'], 'Peacock', '#2a2a33', 'An ex-hitman comes out of retirement to track down the gangsters who wronged him.'),
  movie('Little Women', 2019, 7.8, ['Drama', 'Romance', 'Historical'], ['emotional', 'cozy', 'feel-good'], 'Starz', '#a86a6a', 'The March sisters come of age in the aftermath of the American Civil War.'),
  movie('Blade Runner 2049', 2017, 8.0, ['Sci-Fi', 'Drama', 'Mystery'], ['mind-bending', 'dark', 'epic'], 'Netflix', '#b56a3a', 'A new blade runner unearths a secret that could plunge what’s left of society into chaos.'),
  movie('The Menu', 2022, 7.2, ['Horror', 'Comedy', 'Thriller'], ['dark', 'suspenseful', 'quirky'], 'Max', '#3b4a4a', 'A couple travels to a remote island to eat at an exclusive restaurant with shocking surprises.'),
  movie('Top Gun: Maverick', 2022, 8.2, ['Action', 'Drama'], ['epic', 'intense', 'feel-good', 'nostalgic'], 'Paramount+', '#3a6a8a', 'After thirty years, Maverick trains a detachment of graduates for a specialized mission.'),
  movie('Past Lives', 2023, 7.8, ['Romance', 'Drama'], ['emotional', 'romantic', 'thought-provoking'], 'Paramount+', '#6a5a7a', 'Two childhood friends reunite decades later for one fateful week, confronting destiny and choice.'),
  movie('The Batman', 2022, 7.8, ['Action', 'Crime', 'Superhero', 'Mystery'], ['dark', 'intense', 'suspenseful'], 'Max', '#2b2b3a', 'Batman uncovers corruption in Gotham while pursuing the Riddler, a sadistic killer.'),

  // ---------- TV Shows ----------
  show('Breaking Bad', 2008, 9.5, ['Crime', 'Drama', 'Thriller'], ['dark', 'intense', 'thought-provoking'], 'Netflix', '#4a7a5a', 'A chemistry teacher turned meth manufacturer navigates the dangers of the drug trade.'),
  show('The Wire', 2002, 9.3, ['Crime', 'Drama'], ['dark', 'thought-provoking', 'intense'], 'Max', '#5a6a7a', 'The Baltimore drug scene seen through the eyes of law enforcement and dealers alike.'),
  show('Game of Thrones', 2011, 9.2, ['Fantasy', 'Drama', 'Adventure'], ['epic', 'dark', 'intense', 'violent'], 'Max', '#6a6a7a', 'Noble families vie for control of the Iron Throne as an ancient enemy returns.'),
  show('The Last of Us', 2023, 8.7, ['Drama', 'Horror', 'Adventure'], ['emotional', 'intense', 'dark'], 'Max', '#5a7a4a', 'A smuggler escorts a teenage girl across a post-apocalyptic US ravaged by a fungal plague.'),
  show('Ted Lasso', 2020, 8.8, ['Comedy', 'Drama'], ['feel-good', 'funny', 'uplifting', 'cozy'], 'Apple TV+', '#3a6a9a', 'An American football coach is hired to manage an English soccer team despite no experience.'),
  show('The Bear', 2022, 8.6, ['Drama', 'Comedy'], ['intense', 'emotional', 'thought-provoking'], 'Hulu', '#8a5a2a', 'A young chef returns home to run his family’s chaotic Chicago sandwich shop.'),
  show('Stranger Things', 2016, 8.7, ['Sci-Fi', 'Horror', 'Drama', 'Fantasy'], ['nostalgic', 'suspenseful', 'epic', 'scary'], 'Netflix', '#7a2a3a', 'Kids in a small town uncover supernatural mysteries and government secrets in the 1980s.'),
  show('Succession', 2018, 8.9, ['Drama', 'Comedy'], ['dark', 'thought-provoking', 'intense'], 'Max', '#3a3a4a', 'The Roy family battles for control of a global media empire as their patriarch ages.'),
  show('Fleabag', 2016, 8.7, ['Comedy', 'Drama'], ['funny', 'emotional', 'quirky', 'thought-provoking'], 'Prime Video', '#8a3a4a', 'A dry-witted woman navigates love, grief and family in London, breaking the fourth wall.'),
  show('Better Call Saul', 2015, 9.0, ['Crime', 'Drama'], ['dark', 'thought-provoking', 'suspenseful'], 'Netflix', '#8a7a3a', 'The transformation of small-time lawyer Jimmy McGill into morally flexible Saul Goodman.'),
  show('Arcane', 2021, 8.9, ['Animation', 'Action', 'Fantasy', 'Sci-Fi'], ['epic', 'emotional', 'intense'], 'Netflix', '#5a3a8a', 'Two sisters find themselves on opposing sides of a war between the cities of Piltover and Zaun.'),
  show('The Mandalorian', 2019, 8.6, ['Sci-Fi', 'Adventure', 'Action'], ['epic', 'feel-good', 'nostalgic'], 'Disney+', '#4a5a6a', 'A lone bounty hunter protects a mysterious child across the outer reaches of the galaxy.'),
  show('Severance', 2022, 8.7, ['Sci-Fi', 'Thriller', 'Drama', 'Mystery'], ['mind-bending', 'suspenseful', 'thought-provoking'], 'Apple TV+', '#3a5a7a', 'Employees surgically divide their work and personal memories in a sinister corporation.'),
  show('Chernobyl', 2019, 9.3, ['Drama', 'Historical', 'Thriller'], ['dark', 'intense', 'thought-provoking'], 'Max', '#6a6a5a', 'A dramatization of the 1986 nuclear disaster and the sacrifices made to contain it.'),
  show('The Office', 2005, 9.0, ['Comedy'], ['funny', 'feel-good', 'cozy'], 'Peacock', '#3a6a8a', 'A mockumentary on the everyday lives of office employees at a paper company.'),
  show('Avatar: The Last Airbender', 2005, 9.3, ['Animation', 'Fantasy', 'Adventure', 'Family'], ['epic', 'feel-good', 'emotional'], 'Netflix', '#3a7a8a', 'A young Avatar and his friends journey to restore balance to a war-torn world.'),
  show('Dark', 2017, 8.7, ['Sci-Fi', 'Mystery', 'Thriller', 'Drama'], ['mind-bending', 'dark', 'suspenseful'], 'Netflix', '#2a2a2a', 'A missing child sets four families on a frantic hunt for answers across time.'),
  show('True Detective', 2014, 8.9, ['Crime', 'Drama', 'Mystery'], ['dark', 'intense', 'thought-provoking'], 'Max', '#5a5a3a', 'Detectives’ pasts unravel as they pursue a serial killer across seventeen years.'),
  show('Wednesday', 2022, 8.1, ['Comedy', 'Fantasy', 'Mystery', 'Horror'], ['quirky', 'funny', 'suspenseful'], 'Netflix', '#3a3a5a', 'Wednesday Addams investigates a killing spree while attending a peculiar boarding school.'),
  show('Andor', 2022, 8.4, ['Sci-Fi', 'Drama', 'Thriller'], ['intense', 'thought-provoking', 'epic'], 'Disney+', '#4a4a4a', 'A thief becomes a key player in the rebellion against the Galactic Empire.'),
  show('Shogun', 2024, 8.7, ['Drama', 'Historical', 'War', 'Adventure'], ['epic', 'intense', 'thought-provoking'], 'Hulu', '#7a5a3a', 'A pilot and a powerful lord collide as a woman navigates dangerous political tides in feudal Japan.'),
  show('Only Murders in the Building', 2021, 8.1, ['Comedy', 'Crime', 'Mystery'], ['funny', 'cozy', 'quirky', 'suspenseful'], 'Hulu', '#8a6a3a', 'Three strangers obsessed with true crime investigate a murder in their apartment building.'),
  show('The Crown', 2016, 8.6, ['Drama', 'Historical'], ['emotional', 'thought-provoking', 'cozy'], 'Netflix', '#3a4a6a', 'The reign of Queen Elizabeth II and the events that shaped the second half of the 20th century.'),
  show('Bluey', 2018, 9.4, ['Animation', 'Family', 'Comedy'], ['feel-good', 'cozy', 'uplifting', 'funny'], 'Disney+', '#3a8a9a', 'A lovable Blue Heeler puppy and her family turn everyday life into imaginative play.'),
]

export const SERVICES = [...new Set(CATALOG.map((c) => c.service))].sort()
