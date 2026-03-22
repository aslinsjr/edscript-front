const BASE = 'https://assets.b365api.com/images';

// Tamanhos documentados: s (small), m (medium), b (big)
export function teamImageUrl(imageId, size = 'b') {
  if (!imageId) return null;
  return `${BASE}/team/${size}/${imageId}.png`;
}

// Liga: usa league.id diretamente (sem image_id)
export function leagueImageUrl(leagueId, size = 'b') {
  if (!leagueId) return null;
  return `${BASE}/league/${size}/${leagueId}.png`;
}

// Bandeira por código de país (fallback quando logo não encontrado)
export function leagueFlagUrl(cc) {
  if (!cc) return null;
  return `https://flagcdn.com/w40/${cc.toLowerCase()}.png`;
}
