export const SPORTS = [
  { id: 1,   slug: 'futebol',             name: 'Futebol',             emoji: '⚽', type: 'soccer' },
  { id: 13,  slug: 'tenis',               name: 'Tênis',               emoji: '🎾', type: 'tennis' },
  { id: 18,  slug: 'basquete',            name: 'Basquete',            emoji: '🏀', type: 'basketball' },
  { id: 17,  slug: 'hockey-no-gelo',      name: 'Hockey no Gelo',      emoji: '🏒', type: 'icehockey' },
  { id: 12,  slug: 'futebol-americano',   name: 'Futebol Americano',   emoji: '🏈', type: 'americanfootball' },
  { id: 78,  slug: 'handebol',            name: 'Handebol',            emoji: '🤾', type: 'handball' },
  { id: 91,  slug: 'volei',               name: 'Vôlei',               emoji: '🏐', type: 'volleyball' },
  { id: 92,  slug: 'tenis-de-mesa',       name: 'Tênis de Mesa',       emoji: '🏓', type: 'tabletennis' },
  { id: 83,  slug: 'futsal',              name: 'Futsal',              emoji: '⚽', type: 'soccer' },
  { id: 8,   slug: 'rugby-union',         name: 'Rugby Union',         emoji: '🏉', type: 'rugby' },
  { id: 19,  slug: 'rugby-league',        name: 'Rugby League',        emoji: '🏉', type: 'rugbyleague' },
  { id: 9,   slug: 'boxe',               name: 'Boxe',                emoji: '🥊', type: 'combat' },
  { id: 162, slug: 'mma',                name: 'MMA / UFC',           emoji: '🥋', type: 'combat' },
  { id: 3,   slug: 'cricket',             name: 'Cricket',             emoji: '🏏', type: 'generic' },
  { id: 16,  slug: 'beisebol',            name: 'Beisebol',            emoji: '⚾', type: 'baseball' },
  { id: 14,  slug: 'snooker',             name: 'Snooker',             emoji: '🎱', type: 'generic' },
  { id: 15,  slug: 'dardos',              name: 'Dardos',              emoji: '🎯', type: 'generic' },
  { id: 94,  slug: 'badminton',           name: 'Badminton',           emoji: '🏸', type: 'generic' },
  { id: 95,  slug: 'volei-de-praia',      name: 'Vôlei de Praia',      emoji: '🏐', type: 'volleyball' },
  { id: 2,   slug: 'hipismo',             name: 'Hipismo',             emoji: '🐎', type: 'racing' },
  { id: 4,   slug: 'galgos',              name: 'Galgos',              emoji: '🐕', type: 'racing' },
  { id: 36,  slug: 'futebol-australiano', name: 'Futebol Australiano', emoji: '🏉', type: 'generic' },
  { id: 66,  slug: 'boliche',             name: 'Boliche',             emoji: '🎳', type: 'generic' },
  { id: 75,  slug: 'gaelic-sports',       name: 'Gaelic Sports',       emoji: '🏑', type: 'generic' },
  { id: 90,  slug: 'floorball',           name: 'Floorball',           emoji: '🏑', type: 'generic' },
  { id: 107, slug: 'squash',              name: 'Squash',              emoji: '🎾', type: 'generic' },
  { id: 110, slug: 'polo-aquatico',       name: 'Polo Aquático',       emoji: '🤽', type: 'generic' },
  { id: 151, slug: 'esports',             name: 'E-Sports',            emoji: '🎮', type: 'generic' },
];

export function getSportBySlug(slug) {
  return SPORTS.find(s => s.slug === slug);
}

export function getSportById(id) {
  return SPORTS.find(s => s.id === Number(id)) || null;
}
