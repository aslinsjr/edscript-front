const BASE = 'https://assets.b365api.com/images';

// Tamanhos documentados: s (small), m (medium), b (big)
export function teamImageUrl(imageId, size = 'b') {
  if (!imageId) return null;
  return `${BASE}/team/${size}/${imageId}.png`;
}

// Liga: sem documentação oficial — URL especulativa, pode não funcionar
export function leagueImageUrl(imageId, size = 'b') {
  if (!imageId) return null;
  return `${BASE}/league/${size}/${imageId}.png`;
}
