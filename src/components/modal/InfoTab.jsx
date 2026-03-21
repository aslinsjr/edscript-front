import { timerStr, getPeriodLabel } from '../../utils/sport.js';

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts * 1000);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function countryName(cc) {
  if (!cc) return null;
  try {
    const display = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
    return display.of(cc.toUpperCase()) || cc.toUpperCase();
  } catch {
    return cc.toUpperCase();
  }
}

function InfoItem({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value">{value}</div>
    </div>
  );
}

export default function InfoTab({ ev, sport }) {
  const sportType = sport.type;
  const dateStr = formatDate(ev.time);
  const timer = timerStr(ev, sportType);
  const period = getPeriodLabel(ev, sportType);
  const country = countryName(ev.league?.cc);

  const isRacing = sportType === 'racing';
  const isCombat = sportType === 'combat';
  const isTennis = sportType === 'tennis';
  const isVolleyball = sportType === 'volleyball';
  const isTableTennis = sportType === 'tabletennis';

  // Tennis-specific: points in current game and who is serving
  let tennisPoints = null;
  let tennisServing = null;
  if (isTennis && ev.points) {
    tennisPoints = ev.points;
  }
  if (isTennis && ev.extra) {
    if (ev.extra.serving !== undefined) {
      tennisServing = ev.extra.serving === '1'
        ? (ev.home?.name || 'Casa')
        : ev.extra.serving === '2'
          ? (ev.away?.name || 'Visitante')
          : null;
    }
  }

  // Volleyball / table tennis: sets won + current set points
  let setsHome = null;
  let setsAway = null;
  let curSetPts = null;
  if ((isVolleyball || isTableTennis) && ev.ss) {
    const parts = ev.ss.split('-');
    setsHome = parts[0];
    setsAway = parts[1];
    if (ev.scores) {
      const keys = Object.keys(ev.scores).map(Number).sort((a, b) => b - a);
      if (keys.length > 0) {
        const k = String(keys[0]);
        const s = ev.scores[k];
        if (s) curSetPts = `${s.home || 0} – ${s.away || 0}`;
      }
    }
  }

  // Racing: race number
  const raceNum = isRacing && ev.extra?.num ? ev.extra.num : null;

  return (
    <div className="tab-section">
      <div className="section-title">Informações do Evento</div>
      <div className="info-grid">
        {dateStr && <InfoItem label="Data / Hora" value={dateStr} />}
        {!isRacing && ev.league?.name && <InfoItem label="Liga" value={ev.league.name} />}
        {country && <InfoItem label="País" value={country} />}

        {/* Participants */}
        {isRacing ? (
          <>
            {ev.league?.name && <InfoItem label="Local / Pista" value={ev.league.name} />}
            {raceNum && <InfoItem label="Corrida nº" value={raceNum} />}
          </>
        ) : isCombat ? (
          <>
            <InfoItem label="Lutador A" value={ev.home?.name} />
            <InfoItem label="Lutador B" value={ev.away?.name} />
          </>
        ) : (
          <>
            <InfoItem label="Casa" value={ev.home?.name} />
            <InfoItem label="Visitante" value={ev.away?.name} />
          </>
        )}

        {/* Timer and period */}
        {timer && <InfoItem label="Tempo" value={timer} />}
        {period && <InfoItem label="Período" value={period} />}

        {/* Sport-specific extras */}
        {isTennis && tennisPoints && (
          <InfoItem label="Pontos (game)" value={tennisPoints} />
        )}
        {isTennis && tennisServing && (
          <InfoItem label="Sacando" value={tennisServing} />
        )}

        {isVolleyball && setsHome !== null && (
          <InfoItem
            label="Sets vencidos"
            value={`${ev.home?.name || 'Casa'} ${setsHome} – ${setsAway} ${ev.away?.name || 'Visitante'}`}
          />
        )}
        {isVolleyball && curSetPts && (
          <InfoItem label="Pontos no set atual" value={curSetPts} />
        )}
        {isTableTennis && setsHome !== null && (
          <InfoItem label="Sets vencidos" value={`${setsHome} – ${setsAway}`} />
        )}

        {/* Score if available */}
        {ev.ss && !isRacing && (
          <InfoItem label="Placar" value={ev.ss} />
        )}
      </div>
    </div>
  );
}
