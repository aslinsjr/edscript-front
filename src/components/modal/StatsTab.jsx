// Stats key reference for soccer (bet365 stat IDs)
// 1: Possession %, 7: Shots on target, 8: Shots off target,
// 34: Attacks, 35: Dangerous attacks, 43: Corners,
// 44: Fouls, 45: Yellow cards, 46: Red cards,
// 50: Penalties, 52: Goals, 57: xG

const SOCCER_STATS = [
  { key: '1',  label: 'Posse de bola',      unit: '%' },
  { key: '7',  label: 'Chutes no alvo',     unit: '' },
  { key: '8',  label: 'Chutes fora',        unit: '' },
  { key: '34', label: 'Ataques',            unit: '' },
  { key: '35', label: 'Ataques perigosos',  unit: '' },
  { key: '43', label: 'Escanteios',         unit: '' },
  { key: '44', label: 'Faltas',             unit: '' },
  { key: '45', label: 'Cartões amarelos',   unit: '' },
  { key: '46', label: 'Cartões vermelhos',  unit: '' },
  { key: '50', label: 'Pênaltis',           unit: '' },
  { key: '52', label: 'Gols',               unit: '' },
  { key: '57', label: 'xG',                 unit: '' },
];

function StatBar({ label, homeVal, awayVal, unit }) {
  const h = parseFloat(homeVal) || 0;
  const a = parseFloat(awayVal) || 0;
  const total = h + a;
  const homePct = total > 0 ? (h / total) * 100 : 50;
  const awayPct = total > 0 ? (a / total) * 100 : 50;

  return (
    <div className="stat-bar-block">
      <div className="stat-bar-row">
        <span className="stat-val">{homeVal}{unit}</span>
        <div className="stat-bar-wrap">
          <div className="stat-bar-home" style={{ width: `${homePct}%` }} />
          <div className="stat-bar-away" style={{ width: `${awayPct}%` }} />
        </div>
        <span className="stat-val">{awayVal}{unit}</span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function StatsTab({ ev, sport }) {
  const sportType = sport.type;

  if (sportType !== 'soccer') {
    return (
      <div className="empty-tab">
        <p>Estatísticas detalhadas não estão disponíveis para {sport.name}.</p>
      </div>
    );
  }

  const stats = ev.stats;
  if (!stats || Object.keys(stats).length === 0) {
    return (
      <div className="empty-tab">
        <p>Nenhuma estatística disponível para este evento.</p>
      </div>
    );
  }

  const availableStats = SOCCER_STATS.filter(s => stats[s.key] && typeof stats[s.key] === 'object');

  if (availableStats.length === 0) {
    return (
      <div className="empty-tab">
        <p>Nenhuma estatística disponível para este evento.</p>
      </div>
    );
  }

  return (
    <div className="tab-section">
      <div className="section-title">Estatísticas da Partida</div>
      <div className="stats-teams-header">
        <span style={{ color: '#58a6ff', fontWeight: 600 }}>{ev.home?.name || 'Casa'}</span>
        <span style={{ color: '#f0883e', fontWeight: 600 }}>{ev.away?.name || 'Visitante'}</span>
      </div>
      {availableStats.map(s => {
        const entry = stats[s.key];
        return (
          <StatBar
            key={s.key}
            label={s.label}
            homeVal={entry.home !== undefined ? entry.home : '0'}
            awayVal={entry.away !== undefined ? entry.away : '0'}
            unit={s.unit}
          />
        );
      })}
    </div>
  );
}
