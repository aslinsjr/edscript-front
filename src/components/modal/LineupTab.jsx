import { useState, useEffect } from 'react';
import { fetchLineup } from '../../api/client.js';
import './LineupTab.css';

// ─── estrutura real da API ─────────────────────────────────────────────────
// data.results = array; results[0].home / results[0].away
// Cada time: { name, formation, starting_lineups: [...], substitutes: [...] }
// Cada jogador: { name, pos, order, number, ... }

function extractTeam(data, side) {
  if (!data) return null;
  const root = Array.isArray(data.results) ? data.results[0] : data.results;
  if (!root) return null;
  return root[side] || null;
}

function getStarters(team) {
  const arr = team?.starting_lineups || team?.starters || team?.lineup || [];
  return Array.isArray(arr) ? arr : [];
}

function getSubs(team) {
  const arr = team?.substitutes || team?.bench || team?.subs || [];
  return Array.isArray(arr) ? arr : [];
}

const POS_LABEL = { GK: 'GL', DF: 'DEF', MF: 'MEI', FW: 'ATA' };
const POS_COLOR = {
  GK: '#e3b341', G:  '#e3b341',
  DF: '#58a6ff', D:  '#58a6ff',
  MF: '#3fb950', M:  '#3fb950',
  FW: '#f0883e', F:  '#f0883e',
};

function posLabel(pos) {
  if (!pos) return '';
  const p = String(pos).toUpperCase();
  return POS_LABEL[p] || p;
}

function posColor(pos) {
  if (!pos) return 'var(--text-muted)';
  return POS_COLOR[String(pos).toUpperCase()] || 'var(--text-muted)';
}

// ─── linha de jogador ──────────────────────────────────────────────────────

function PlayerRow({ player, showPos }) {
  const name   = player.name || player.player_name || '—';
  const number = player.number ?? player.jersey_number ?? '';
  const pos    = player.pos || player.position || '';

  return (
    <div className="lineup-player-row">
      {number !== '' && <span className="lineup-number">{number}</span>}
      <span className="lineup-name">{name}</span>
      {showPos && pos && (
        <span className="lineup-pos" style={{ color: posColor(pos) }}>{posLabel(pos)}</span>
      )}
    </div>
  );
}

// ─── coluna de um time ─────────────────────────────────────────────────────

function TeamColumn({ teamName, teamData, level, side }) {
  const starters  = getStarters(teamData);
  const subs      = getSubs(teamData);
  const formation = teamData?.formation || null;
  const showPos   = level !== 'beginner';
  const showBench = level !== 'beginner';
  const isHome    = side === 'home';

  if (starters.length === 0) {
    return (
      <div className="lineup-team-col">
        <div className={`lineup-team-name ${isHome ? 'lineup-home' : 'lineup-away'}`}>{teamName}</div>
        <p className="lineup-empty">Escalação não divulgada.</p>
      </div>
    );
  }

  return (
    <div className="lineup-team-col">
      <div className={`lineup-team-name ${isHome ? 'lineup-home' : 'lineup-away'}`}>
        {teamName}
        {formation && <span className="lineup-formation">{formation}</span>}
      </div>

      <div className="lineup-section-label">Titulares</div>
      <div className="lineup-players">
        {starters.map((p, i) => <PlayerRow key={i} player={p} showPos={showPos} />)}
      </div>

      {showBench && subs.length > 0 && (
        <>
          <div className="lineup-section-label lineup-bench-label">Banco</div>
          <div className="lineup-players lineup-bench">
            {subs.map((p, i) => <PlayerRow key={i} player={p} showPos={showPos} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────

export default function LineupTab({ ev, level }) {
  const [status, setStatus] = useState('idle');
  const [data,   setData]   = useState(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setData(null);
    setErrMsg('');

    fetchLineup(ev.id)
      .then(d  => { if (!cancelled) { setData(d);          setStatus('done');  } })
      .catch(e => { if (!cancelled) { setErrMsg(e.message); setStatus('error'); } });

    return () => { cancelled = true; };
  }, [ev.id]);

  if (status === 'loading') {
    return (
      <div className="ai-loading">
        <div className="spinner" />
        <span>Carregando escalações...</span>
      </div>
    );
  }
  if (status === 'error') {
    return <div className="ai-error"><strong>Erro ao carregar escalação:</strong> {errMsg}</div>;
  }
  if (status === 'done') {
    const results = data?.results;

    // results = array vazio → sem lineup
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return <div className="empty-tab"><p>Escalação não disponível para este evento.</p></div>;
    }

    const homeTeam = extractTeam(data, 'home');
    const awayTeam = extractTeam(data, 'away');
    const homeName = ev.home?.name || 'Casa';
    const awayName = ev.away?.name || 'Visitante';

    if (!homeTeam && !awayTeam) {
      return <div className="empty-tab"><p>Escalação não disponível para este evento.</p></div>;
    }

    return (
      <div className="tab-section">
        <div className="section-title">Escalações</div>
        <div className="lineup-grid">
          <TeamColumn teamName={homeName} teamData={homeTeam} level={level} side="home" />
          <div className="lineup-divider" />
          <TeamColumn teamName={awayName} teamData={awayTeam} level={level} side="away" />
        </div>
      </div>
    );
  }
  return null;
}
