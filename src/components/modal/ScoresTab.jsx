import { getPeriodLabels, getTotalKey } from '../../utils/sport.js';

function buildSoccerRows(scores, periodLabels) {
  if (!scores) return [];
  const rows = [];
  const orderedKeys = ['1', '2', '3', '4'];
  for (const k of orderedKeys) {
    if (scores[k]) {
      rows.push({
        key: k,
        label: periodLabels[k] || `Período ${k}`,
        home: scores[k].home,
        away: scores[k].away,
        isTotal: false,
      });
    }
  }
  return rows;
}

function buildGenericRows(scores, periodLabels, totalKey) {
  if (!scores) return [];
  const rows = [];
  const numericKeys = Object.keys(scores)
    .map(Number)
    .sort((a, b) => a - b);

  for (const nk of numericKeys) {
    const k = String(nk);
    if (totalKey && k === totalKey) continue;
    const entry = scores[k];
    rows.push({
      key: k,
      label: periodLabels[k] || `Período ${k}`,
      home: entry.home,
      away: entry.away,
      isTotal: false,
    });
  }

  if (totalKey && scores[totalKey]) {
    rows.push({
      key: totalKey,
      label: periodLabels[totalKey] || 'Total',
      home: scores[totalKey].home,
      away: scores[totalKey].away,
      isTotal: true,
    });
  }

  return rows;
}

function buildTennisRows(scores) {
  if (!scores) return [];
  const rows = [];
  const numericKeys = Object.keys(scores)
    .map(Number)
    .sort((a, b) => a - b);

  for (const nk of numericKeys) {
    const k = String(nk);
    const entry = scores[k];
    rows.push({
      key: k,
      label: `Set ${nk}`,
      home: entry.home,
      away: entry.away,
      isTotal: false,
    });
  }
  return rows;
}

export default function ScoresTab({ ev, sport }) {
  const sportType = sport.type;
  const scores = ev.scores;
  const ss = ev.ss;

  const isTennis = sportType === 'tennis' || sportType === 'tabletennis';
  const isVolleyball = sportType === 'volleyball';
  const periodLabels = getPeriodLabels(sportType);
  const totalKey = getTotalKey(sportType);

  let rows = [];
  let showSetsTotal = false;

  if (isTennis || isVolleyball) {
    rows = buildTennisRows(scores);
    showSetsTotal = true;
  } else if (sportType === 'soccer' || sportType === 'futsal') {
    rows = buildSoccerRows(scores, periodLabels);
  } else {
    rows = buildGenericRows(scores, periodLabels, totalKey);
  }

  const hasRows = rows.length > 0;

  if (!hasRows && !ss) {
    return (
      <div className="empty-tab">
        <p>Nenhuma parcial disponível para este evento.</p>
      </div>
    );
  }

  // Parse ss for total
  let totalHome = null;
  let totalAway = null;
  if (ss) {
    const parts = ss.split('-');
    totalHome = parts[0] ?? null;
    totalAway = parts[1] ?? null;
  }

  // Away/home names
  const homeName = ev.home?.name || 'Casa';
  const awayName = ev.away?.name || 'Visitante';

  return (
    <div className="tab-section">
      <div className="section-title">Parciais</div>
      {hasRows ? (
        <table className="scores-table">
          <thead>
            <tr>
              <th>Período</th>
              <th style={{ color: '#58a6ff' }}>{homeName}</th>
              <th style={{ color: '#f0883e' }}>{awayName}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className={row.isTotal ? 'row-total' : ''}>
                <td className={row.isTotal ? 'cell-total-label' : ''}>{row.label}</td>
                <td className={row.isTotal ? 'cell-home cell-total' : 'cell-home'}>
                  {row.home ?? '–'}
                </td>
                <td className={row.isTotal ? 'cell-away cell-total' : 'cell-away'}>
                  {row.away ?? '–'}
                </td>
              </tr>
            ))}

            {/* For tennis/volleyball: show sets won from ss */}
            {showSetsTotal && ss && (
              <tr className="row-total">
                <td className="cell-total-label">Sets vencidos</td>
                <td className="cell-home cell-total">{totalHome ?? '–'}</td>
                <td className="cell-away cell-total">{totalAway ?? '–'}</td>
              </tr>
            )}

            {/* For soccer/generic: show total from ss if no totalKey row already added */}
            {!isTennis && !isVolleyball && !totalKey && ss && (
              <tr className="row-total">
                <td className="cell-total-label">Total</td>
                <td className="cell-home cell-total">{totalHome ?? '–'}</td>
                <td className="cell-away cell-total">{totalAway ?? '–'}</td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        ss && (
          <table className="scores-table">
            <thead>
              <tr>
                <th>Placar</th>
                <th style={{ color: '#58a6ff' }}>{homeName}</th>
                <th style={{ color: '#f0883e' }}>{awayName}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-total">
                <td className="cell-total-label">Total</td>
                <td className="cell-home cell-total">{totalHome ?? '–'}</td>
                <td className="cell-away cell-total">{totalAway ?? '–'}</td>
              </tr>
            </tbody>
          </table>
        )
      )}
    </div>
  );
}
