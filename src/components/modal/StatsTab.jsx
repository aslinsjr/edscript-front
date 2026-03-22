import './StatsTab.css';

// Stats keyed by API field name; values come as [homeVal, awayVal]
const SOCCER_STATS = [
  { key: 'possession_rt',    label: 'Posse de bola',        unit: '%' },
  { key: 'on_target',        label: 'Chutes no alvo',       unit: '' },
  { key: 'off_target',       label: 'Chutes fora',          unit: '' },
  { key: 'attacks',          label: 'Ataques',              unit: '' },
  { key: 'dangerous_attacks',label: 'Ataques perigosos',    unit: '' },
  { key: 'corners',          label: 'Escanteios',           unit: '' },
  { key: 'key_passes',       label: 'Passes-chave',         unit: '' },
  { key: 'passing_accuracy', label: 'Precisão de passe',    unit: '%' },
  { key: 'penalties',        label: 'Pênaltis',             unit: '' },
  { key: 'redcards',         label: 'Cartões vermelhos',    unit: '' },
  { key: 'substitutions',    label: 'Substituições',        unit: '' },
  { key: 'goals',            label: 'Gols',                 unit: '' },
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

  // API returns values as [homeVal, awayVal] arrays
  const availableStats = SOCCER_STATS.filter(s => Array.isArray(stats[s.key]));

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
        const [homeVal, awayVal] = stats[s.key];
        return (
          <StatBar
            key={s.key}
            label={s.label}
            homeVal={homeVal ?? '0'}
            awayVal={awayVal ?? '0'}
            unit={s.unit}
          />
        );
      })}
    </div>
  );
}
