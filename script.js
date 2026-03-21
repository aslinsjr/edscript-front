const BASE = 'https://edscript-api.vercel.app';
let currentPath = '/api/events/inplay';
let lastData = null;
let currentView = 'cards';

const STATUS_MAP = {
  '0':  ['Não Iniciado',    'status-upcoming'],
  '1':  ['Ao Vivo',         'status-live'],
  '2':  ['A Corrigir',      'status-ended'],
  '3':  ['Encerrado',       'status-ended'],
  '4':  ['Adiado',          'status-ended'],
  '5':  ['Cancelado',       'status-ended'],
  '6':  ['W.O.',            'status-ended'],
  '7':  ['Interrompido',    'status-ended'],
  '8':  ['Abandonado',      'status-ended'],
  '9':  ['Retirado',        'status-ended'],
  '10': ['Suspenso',        'status-ended'],
  '11': ['Dec. por FA',     'status-ended'],
  '12': ['Desclassificado', 'status-ended'],
  '99': ['Removido',        'status-ended'],
};

const SPORT_TYPE = {
  1:'soccer', 83:'soccer',
  13:'tennis',
  18:'basketball',
  17:'icehockey',
  91:'volleyball', 95:'volleyball',
  92:'tabletennis',
  78:'handball',
  2:'racing', 4:'racing',
  9:'combat', 162:'combat',
  3:'cricket', 16:'baseball',
  14:'snooker', 15:'darts',
  94:'badminton', 110:'waterpolo',
};

function getSportType(ev) { return SPORT_TYPE[parseInt(ev.sport_id)] || 'generic'; }

function timerStr(ev, sport) {
  if (!ev.timer) return null;
  const t = ev.timer;
  const pad = n => String(n || 0).padStart(2, '0');
  if (sport === 'basketball') {
    const q = t.q ? `Q${t.q}` : '';
    const time = t.tm !== undefined ? ` ${t.tm}:${pad(t.ts)}` : '';
    return (q + time).trim();
  }
  if (sport === 'icehockey') {
    const P = {'1':'P1','2':'P2','3':'P3','4':'OT','5':'SO'};
    const p = t.q ? (P[t.q] || `P${t.q}`) : '';
    const time = t.tm !== undefined ? ` ${t.tm}:${pad(t.ts)}` : '';
    return (p + time).trim();
  }
  let s = `${t.tm}'`;
  if (t.ta && parseInt(t.ta) > 0) s += `+${t.ta}`;
  return s;
}

function formatScore(ev, sport) {
  if (!ev.ss) return '';
  if (sport === 'tennis') {
    return ev.ss + (ev.points ? ` <span style="font-size:14px;opacity:0.7">(${ev.points})</span>` : '');
  }
  if (sport === 'volleyball') {
    return `<span style="font-size:13px;opacity:0.55">ponto: </span>${ev.ss}`;
  }
  return ev.ss;
}

function getPeriodLabels(sport) {
  if (sport === 'basketball') return {'1':'1º Quarto','2':'2º Quarto','3':'3º Quarto','4':'4º Quarto','5':'OT 1','6':'OT 2','7':'Total'};
  if (sport === 'icehockey') return {'1':'1º Período','2':'2º Período','3':'3º Período','4':'Prorrogação','5':'Total'};
  if (sport === 'handball') return {'1':'1º Tempo','2':'2º Tempo','3':'Prorrogação Extra','4':'Total'};
  return {'1':'1º Tempo','2':'2º Tempo','3':'Prorrogação','4':'Pênaltis'};
}

function selectEndpoint(btn) {
  document.querySelectorAll('.endpoint-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentPath = btn.dataset.path;
  buildParams(btn.dataset.required || '', btn.dataset.optional || '', btn.dataset.note || '');
  document.getElementById('endpoint-title').textContent = 'GET ' + currentPath;
}

function buildParams(required, optional, note) {
  const grid = document.getElementById('params-grid');
  grid.innerHTML = '';

  required.split(',').filter(Boolean).forEach(p => {
    grid.appendChild(makeField(p.trim(), false));
  });

  optional.split(',').filter(Boolean).forEach(p => {
    grid.appendChild(makeField(p.trim(), true));
  });

  // Default sport_id
  const si = document.getElementById('param-sport_id');
  if (si && !si.value) si.value = '1';

  const btn = document.createElement('button');
  btn.id = 'run-btn';
  btn.textContent = 'Executar';
  btn.onclick = runRequest;
  grid.appendChild(btn);

  document.getElementById('note').textContent = note ? '⚠ ' + note : '';
}

function setSport(btn, id) {
  document.querySelectorAll('.sport-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const input = document.getElementById('param-sport_id');
  if (input) {
    input.value = id;
    input.style.borderColor = '#58a6ff';
    setTimeout(() => input.style.borderColor = '', 800);
  }
}

function makeField(name, isOptional) {
  const wrap = document.createElement('div');
  wrap.className = 'param-field';
  const label = document.createElement('label');
  label.textContent = name + (isOptional ? '' : ' *');
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'param-' + name;
  input.placeholder = isOptional ? '(opcional)' : name;
  if (name === 'sport_id') input.value = '1';
  if (name === 'page') input.value = '1';
  if (isOptional) {
    const opt = document.createElement('span');
    opt.className = 'optional';
    opt.textContent = 'opcional';
    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(opt);
  } else {
    wrap.appendChild(label);
    wrap.appendChild(input);
  }
  return wrap;
}

async function runRequest() {
  const btn = document.getElementById('run-btn');
  btn.disabled = true;
  btn.textContent = 'Buscando...';

  document.getElementById('loading').style.display = 'block';
  document.getElementById('placeholder').style.display = 'none';
  document.getElementById('status-bar').style.display = 'none';
  document.getElementById('cards-container').innerHTML = '';
  document.getElementById('json-container').style.display = 'none';
  document.getElementById('error-msg').style.display = 'none';

  const params = new URLSearchParams();
  document.querySelectorAll('[id^="param-"]').forEach(inp => {
    const key = inp.id.replace('param-', '');
    if (inp.value.trim()) params.set(key, inp.value.trim());
  });

  const url = BASE + currentPath + (params.toString() ? '?' + params.toString() : '');

  try {
    const res = await fetch(url);
    const data = await res.json();
    lastData = data;
    if (currentPath === '/api/events/inplay') {
      console.group('%c[Inplay] Resposta da API', 'color:#58a6ff;font-weight:bold');
      console.log('%cTotal de eventos:', 'color:#8b949e', data.pager?.total);
      console.log('%cResultados:', 'color:#8b949e', data.results);
      console.groupEnd();
    }
    render(data);
  } catch (e) {
    showError('Erro ao conectar: ' + e.message);
  } finally {
    document.getElementById('loading').style.display = 'none';
    btn.disabled = false;
    btn.textContent = 'Executar';
  }
}

function render(data) {
  if (!data.success && data.success !== undefined) {
    showError('API retornou erro. Verifique os parâmetros.');
    return;
  }

  document.getElementById('status-bar').style.display = 'flex';
  const raw = data.results !== undefined ? data.results : data;
  const results = Array.isArray(raw) ? raw : [raw];
  document.getElementById('total-count').textContent = data.pager ? data.pager.total : results.length;
  document.getElementById('page-info').textContent = data.pager ? data.pager.page + ' / ' + Math.ceil(data.pager.total / data.pager.per_page) : '1';

  renderCards(results);
  renderJson(data);

  if (currentView === 'json') {
    document.getElementById('cards-container').style.display = 'none';
    document.getElementById('json-container').style.display = 'block';
  } else {
    document.getElementById('cards-container').style.display = 'grid';
    document.getElementById('json-container').style.display = 'none';
  }
}

function renderCards(results) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  if (!results || results.length === 0) {
    container.innerHTML = '<p style="color:#8b949e;padding:40px;text-align:center">Nenhum resultado encontrado.</p>';
    return;
  }

  results.forEach(item => {
    const card = document.createElement('div');
    card.className = 'event-card';

    // Detect type
    if (item.home && item.away) {
      renderEventCard(card, item);
      card.addEventListener('click', () => openModal(item));
    } else if (item.odds) {
      renderOddsCard(card, item);
    } else {
      renderGenericCard(card, item);
    }

    container.appendChild(card);
  });
}

function renderEventCard(card, ev) {
  const [statusLabel, statusClass] = STATUS_MAP[ev.time_status] || ['Desconhecido', 'status-ended'];
  const date = new Date(parseInt(ev.time) * 1000).toLocaleString('pt-BR');

  let html = `
    <div class="card-league">
      ${ev.league ? `🏆 ${ev.league.name}` : ''}
      ${ev.league && ev.league.cc ? `<span class="meta-tag">${ev.league.cc.toUpperCase()}</span>` : ''}
      <span class="meta-tag ${statusClass}">${statusLabel}</span>
      ${timerStr(ev, getSportType(ev)) ? `<span class="meta-tag">${timerStr(ev, getSportType(ev))}</span>` : ''}
    </div>
    <div class="card-teams">${ev.home?.name || '—'} <span style="color:#8b949e">vs</span> ${ev.away?.name || '—'}</div>
    ${ev.ss ? `<div class="card-score">${formatScore(ev, getSportType(ev))}</div>` : ''}
    <div class="card-meta">
      <span class="meta-tag">ID: ${ev.id}</span>
      <span class="meta-tag">${date}</span>
      ${ev.bet365_id ? `<span class="meta-tag">Bet365: ${ev.bet365_id}</span>` : ''}
    </div>
  `;

  if (ev.stats) {
    const s = ev.stats;
    html += `<div class="card-stats">`;
    const pairs = [
      ['Posse', s.possession_rt ? s.possession_rt[0]+'% / '+s.possession_rt[1]+'%' : null],
      ['Chutes no alvo', s.on_target ? s.on_target[0]+' / '+s.on_target[1] : null],
      ['Chutes fora', s.off_target ? s.off_target[0]+' / '+s.off_target[1] : null],
      ['Escanteios', s.corners ? s.corners[0]+' / '+s.corners[1] : null],
      ['Gols', s.goals ? s.goals[0]+' / '+s.goals[1] : null],
      ['Cartões Amar.', s.yellowcards ? s.yellowcards[0]+' / '+s.yellowcards[1] : null],
      ['Cartões Verm.', s.redcards ? s.redcards[0]+' / '+s.redcards[1] : null],
      ['xG', s.xg ? s.xg[0]+' / '+s.xg[1] : null],
    ];
    pairs.filter(([,v]) => v).forEach(([k,v]) => {
      html += `<div class="stat-row"><span>${k}</span><strong>${v}</strong></div>`;
    });
    html += `</div>`;
  }

  card.innerHTML = html;
}

function renderOddsCard(card, item) {
  card.innerHTML = `<pre style="font-size:11px;color:#c9d1d9;white-space:pre-wrap">${JSON.stringify(item, null, 2)}</pre>`;
}

function renderGenericCard(card, item) {
  // Odds Summary: objeto com casas como chaves
  if (item && !item.lineup && !item.odds && typeof item === 'object' && !Array.isArray(item)) {
    const keys = Object.keys(item);
    // detecta se é uma casa de apostas (tem .odds dentro)
    const isOddsSummary = keys.some(k => item[k] && item[k].odds);
    if (isOddsSummary) {
      card.style.gridColumn = '1 / -1';
      const MARKET = { '1_1': '1X2', '1_2': 'Asian Handicap', '1_3': 'Over/Under' };
      let html = `<div style="font-size:13px;font-weight:600;color:#e6edf3;margin-bottom:12px">Odds por Casa</div>`;
      html += `<div style="overflow-x:auto"><table class="odds-table"><thead><tr><th>Casa</th><th>Mercado</th><th>Início</th><th>Kickoff</th><th>Final</th></tr></thead><tbody>`;
      keys.forEach(casa => {
        const d = item[casa];
        if (!d || !d.odds) return;
        const { start, kickoff, end } = d.odds;
        Object.keys(MARKET).forEach(mkt => {
          const s = start?.[mkt], k = kickoff?.[mkt], e = end?.[mkt];
          if (!s && !k && !e) return;
          const fmt = o => {
            if (!o) return '<span style="color:#484f58">—</span>';
            if (o.home_od) return `${o.home_od} / ${o.draw_od||'-'} / ${o.away_od}`;
            if (o.over_od) return `O${o.handicap} ${o.over_od} / U ${o.under_od}`;
            return '—';
          };
          html += `<tr><td style="color:#c9d1d9">${casa}</td><td><span class="meta-tag">${MARKET[mkt]}</span></td><td>${fmt(s)}</td><td>${fmt(k)}</td><td>${fmt(e)}</td></tr>`;
        });
      });
      html += `</tbody></table></div>`;
      card.innerHTML = html;
      return;
    }
  }

  // Odds (movimento): tem item.odds como objeto de mercados
  if (item && item.odds && typeof item.odds === 'object' && !Array.isArray(item.odds)) {
    card.style.gridColumn = '1 / -1';
    const MARKET = { '1_1': '1X2', '1_2': 'Asian Handicap', '1_3': 'Over/Under' };
    let html = `<div style="font-size:13px;font-weight:600;color:#e6edf3;margin-bottom:12px">Movimento de Odds</div>`;
    Object.keys(item.odds).forEach(mkt => {
      const entries = item.odds[mkt];
      if (!Array.isArray(entries) || entries.length === 0) return;
      html += `<div style="margin-bottom:14px"><div style="font-size:11px;color:#8b949e;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">${MARKET[mkt]||mkt}</div><div style="overflow-x:auto"><table class="odds-table"><thead><tr><th>Min</th><th>Placar</th>`;
      const first = entries[0];
      if (first.home_od !== undefined) html += `<th>Casa</th><th>Empate</th><th>Fora</th>`;
      if (first.over_od !== undefined) html += `<th>Handicap</th><th>Over</th><th>Under</th>`;
      if (first.handicap !== undefined && first.home_od !== undefined) html += `<th>Handicap</th>`;
      html += `</tr></thead><tbody>`;
      entries.slice(0, 30).forEach(o => {
        html += `<tr><td>${o.time_str||'—'}'</td><td>${o.ss||'—'}</td>`;
        if (o.home_od !== undefined) html += `<td>${o.home_od}</td><td>${o.draw_od||'—'}</td><td>${o.away_od}</td>`;
        if (o.over_od !== undefined) html += `<td>${o.handicap}</td><td>${o.over_od}</td><td>${o.under_od}</td>`;
        html += `</tr>`;
      });
      html += `</tbody></table></div></div>`;
    });
    card.innerHTML = html;
    return;
  }

  // Lineup / stats_trend / generic
  if (item.lineup) {
    const home = item.lineup.home || {};
    const away = item.lineup.away || {};
    card.style.gridColumn = '1 / -1';
    let html = `<div class="lineup-container">`;
    ['home','away'].forEach(side => {
      const team = item.lineup[side] || {};
      html += `<div class="lineup-team"><h3>${team.name || side.toUpperCase()}</h3>`;
      (team.starting_11 || []).forEach(p => {
        html += `<div class="player-row"><span class="player-num">${p.jersey_number||''}</span><span class="player-pos">${p.position||''}</span>${p.name||p.player_name||''}</div>`;
      });
      if (team.substitutes?.length) {
        html += `<div style="font-size:11px;color:#8b949e;margin-top:8px;margin-bottom:4px">Reservas</div>`;
        team.substitutes.forEach(p => {
          html += `<div class="player-row" style="opacity:0.6"><span class="player-num">${p.jersey_number||''}</span><span class="player-pos">${p.position||''}</span>${p.name||p.player_name||''}</div>`;
        });
      }
      html += `</div>`;
    });
    html += `</div>`;
    card.innerHTML = html;
  } else {
    card.innerHTML = `<pre style="font-size:11px;color:#c9d1d9;white-space:pre-wrap;overflow:auto">${JSON.stringify(item, null, 2)}</pre>`;
  }
}

function renderJson(data) {
  document.getElementById('json-pre').innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));
}

function syntaxHighlight(json) {
  return json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
      let cls = 'json-num';
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-key' : 'json-str';
      else if (/true|false/.test(match)) cls = 'json-bool';
      else if (/null/.test(match)) cls = 'json-null';
      return `<span class="${cls}">${match}</span>`;
    });
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll('.toggle-btn').forEach((b, i) => b.classList.toggle('active', (i===0 && view==='cards') || (i===1 && view==='json')));
  if (!lastData) return;
  if (view === 'json') {
    document.getElementById('cards-container').style.display = 'none';
    document.getElementById('json-container').style.display = 'block';
  } else {
    document.getElementById('cards-container').style.display = 'grid';
    document.getElementById('json-container').style.display = 'none';
  }
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.style.display = 'block';
  document.getElementById('status-bar').style.display = 'none';
  document.getElementById('placeholder').style.display = 'none';
}

// ── MODAL ──────────────────────────────────────────────
let modalEvent = null;
let modalTab = 'info';

function openModal(ev) {
  modalEvent = ev;
  modalTab = 'info';

  const sport = getSportType(ev);
  const [statusLabel, statusClass] = STATUS_MAP[ev.time_status] || ['Desconhecido', 'status-ended'];
  const timerBadge = timerStr(ev, sport);
  document.getElementById('m-league').innerHTML =
    `🏆 ${ev.league?.name || '—'} ${ev.league?.cc ? `<span class="meta-tag">${ev.league.cc.toUpperCase()}</span>` : ''} <span class="meta-tag ${statusClass}">${statusLabel}</span>${timerBadge ? ` <span class="meta-tag">${timerBadge}</span>` : ''}`;
  const separator = sport === 'combat' ? ' 🥊 ' : '  vs  ';
  document.getElementById('m-teams').textContent = `${ev.home?.name || '—'}${separator}${ev.away?.name || '—'}`;
  document.getElementById('m-score').textContent = ev.ss || '';

  document.querySelectorAll('.m-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  renderModalTab('info');
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay') && e.target !== document.getElementById('modal-close')) return;
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { document.getElementById('modal-overlay').classList.remove('open'); document.body.style.overflow = ''; } });

function switchModalTab(tab) {
  modalTab = tab;
  const MAP = { info: 'inf', stats: 'est', scores: 'par', ai: 'pr', json: 'js' };
  const prefix = MAP[tab] || tab;
  document.querySelectorAll('.m-tab').forEach(t =>
    t.classList.toggle('active', t.textContent.toLowerCase().startsWith(prefix))
  );
  renderModalTab(tab);
}

function renderModalTab(tab) {
  const body = document.getElementById('modal-body');
  const ev = modalEvent;
  if (!ev) return;

  if (tab === 'info') {
    const sport = getSportType(ev);
    const date = new Date(parseInt(ev.time) * 1000).toLocaleString('pt-BR');
    const timer = timerStr(ev, sport);

    // Period/Quarter label per sport
    let periodLabel = '—';
    if ((sport === 'soccer' || sport === 'handball') && ev.timer?.md) {
      periodLabel = ev.timer.md === 1 ? '1º Tempo' : ev.timer.md === 2 ? '2º Tempo' : `Período ${ev.timer.md}`;
    } else if (sport === 'basketball' && ev.timer?.q) {
      const q = parseInt(ev.timer.q);
      periodLabel = q <= 4 ? `${q}º Quarto` : `Prorrogação ${q - 4}`;
    } else if (sport === 'icehockey' && ev.timer?.q) {
      const P = {'1':'1º Período','2':'2º Período','3':'3º Período','4':'Prorrogação','5':'Shootout'};
      periodLabel = P[ev.timer.q] || `Período ${ev.timer.q}`;
    }

    const timerRow = timer ? ['Tempo', timer] : null;
    const isCombat = sport === 'combat';

    const infos = [
      ['ID do Evento', ev.id],
      ['Sport ID', ev.sport_id],
      ['Data/Hora', date],
      ['Bet365 ID', ev.bet365_id || '—'],
      ['Liga ID', ev.league?.id || '—'],
      ['País', (ev.league?.cc || ev.home?.cc || '—').toUpperCase()],
      [isCombat ? 'Lutador A (ID)' : 'Time Casa ID', ev.home?.id || '—'],
      [isCombat ? 'Lutador B (ID)' : 'Time Fora ID', ev.away?.id || '—'],
      timerRow,
      !isCombat ? ['Período', periodLabel] : null,
    ].filter(Boolean);

    // Sport-specific extra fields
    if (sport === 'tennis') {
      if (ev.points !== undefined) infos.push(['Pontos (game atual)', ev.points]);
      if (ev.playing_indicator !== undefined) {
        const serving = String(ev.playing_indicator).startsWith('0')
          ? (ev.home?.name || 'Casa') : (ev.away?.name || 'Fora');
        infos.push(['Sacando', '🎾 ' + serving]);
      }
    }
    if (sport === 'volleyball' && ev.scores) {
      const keys = Object.keys(ev.scores).map(Number).sort((a,b) => a-b);
      let hw = 0, aw = 0;
      keys.forEach(k => { const s = ev.scores[k]; if (parseInt(s.home) > parseInt(s.away)) hw++; else if (parseInt(s.away) > parseInt(s.home)) aw++; });
      infos.push(['Sets vencidos', `${hw} — ${aw}`]);
      if (ev.ss) infos.push(['Pontos no set atual', ev.ss]);
    }
    if (sport === 'tabletennis' && ev.ss) {
      infos.push(['Sets vencidos', ev.ss]);
    }
    if ((sport === 'racing') && ev.round) {
      infos.push(['Corrida nº', ev.round]);
    }

    body.innerHTML = `
      <div class="m-section">
        <div class="m-section-title">Dados Gerais</div>
        <div class="m-info-grid">
          ${infos.map(([l, v]) => `<div class="m-info-item"><div class="m-info-label">${l}</div><div class="m-info-value">${v}</div></div>`).join('')}
        </div>
      </div>`;
  }

  else if (tab === 'stats') {
    const s = ev.stats;
    if (!s) {
      const sport = getSportType(ev);
      const msg = sport === 'soccer' ? 'Sem estatísticas disponíveis.' : 'Estatísticas detalhadas não estão disponíveis para este esporte.';
      body.innerHTML = `<p style="color:#8b949e;padding:20px">${msg}</p>`;
      return;
    }

    const statItems = [
      ['Posse de bola', s.possession_rt, '%'],
      ['Chutes no alvo', s.on_target],
      ['Chutes fora', s.off_target],
      ['Ataques', s.attacks],
      ['Ataques perigosos', s.dangerous_attacks],
      ['Escanteios', s.corners],
      ['Faltas', s.fouls],
      ['Cartões amarelos', s.yellowcards],
      ['Cartões vermelhos', s.redcards],
      ['Pênaltis', s.penalties],
      ['Gols', s.goals],
      ['Substituições', s.substitutions],
      ['xG', s.xg],
      ['Finalizações bloqueadas', s.shots_blocked],
      ['Defesas', s.saves],
    ];

    const home = ev.home?.name || 'Casa';
    const away = ev.away?.name || 'Fora';

    let html = `
      <div class="m-section">
        <div class="m-teams-label"><span style="color:#58a6ff">${home}</span><span style="color:#f0883e">${away}</span></div>`;

    statItems.forEach(([label, arr, suffix = '']) => {
      if (!arr) return;
      const h = parseFloat(arr[0]) || 0;
      const a = parseFloat(arr[1]) || 0;
      const total = h + a || 1;
      const pctH = (h / total * 100).toFixed(1);
      const pctA = (a / total * 100).toFixed(1);
      html += `
        <div class="m-stat-bar-row">
          <div class="m-stat-val">${arr[0]}${suffix}</div>
          <div class="m-stat-bar-wrap">
            <div class="m-stat-bar-home" style="width:${pctH}%"></div>
            <div class="m-stat-bar-away" style="width:${pctA}%"></div>
          </div>
          <div class="m-stat-val-away">${arr[1]}${suffix}</div>
        </div>
        <div style="text-align:center;font-size:10px;color:#484f58;margin-top:-6px;margin-bottom:8px">${label}</div>`;
    });

    html += `</div>`;
    body.innerHTML = html;
  }

  else if (tab === 'scores') {
    const sc = ev.scores;
    if (!sc) { body.innerHTML = `<p style="color:#8b949e;padding:20px">Sem parciais disponíveis.</p>`; return; }

    const sport = getSportType(ev);
    const PERIOD = getPeriodLabels(sport);
    // Keys that represent the running total, not a distinct period
    const TOTAL_KEY = {basketball:'7', icehockey:'5', handball:'4'}[sport];
    const useSetLabel = sport === 'tennis' || sport === 'tabletennis' || sport === 'volleyball';
    const colHeader = useSetLabel ? 'Set' : 'Período';

    let html = `<div class="m-section"><div class="m-section-title">Parciais</div>`;
    html += `<table class="odds-table"><thead><tr><th>${colHeader}</th><th>${ev.home?.name || 'Casa'}</th><th>${ev.away?.name || 'Fora'}</th></tr></thead><tbody>`;

    Object.keys(sc).sort((a,b) => parseInt(a)-parseInt(b)).forEach(k => {
      const isTotal = k === TOTAL_KEY;
      const label = useSetLabel ? `Set ${k}` : (PERIOD[k] || `${colHeader} ${k}`);
      const rowStyle = isTotal ? ' style="border-top:2px solid #30363d"' : '';
      const tdStyle = isTotal ? 'font-weight:700;color:#e6edf3' : '';
      const valStyle = `color:{{C}};${isTotal ? 'font-weight:700;font-size:15px' : 'font-weight:600'}`;
      html += `<tr${rowStyle}>
        <td style="${tdStyle}">${label}</td>
        <td style="${valStyle.replace('{{C}}','#58a6ff')}">${sc[k].home}</td>
        <td style="${valStyle.replace('{{C}}','#f0883e')}">${sc[k].away}</td>
      </tr>`;
    });

    // For soccer/tennis/generic: show total row from ss if no total key in scores
    if (!TOTAL_KEY && ev.ss && !useSetLabel) {
      const parts = ev.ss.split('-');
      if (parts.length === 2) {
        html += `<tr style="border-top:2px solid #30363d">
          <td style="font-weight:700;color:#e6edf3">Total</td>
          <td style="color:#58a6ff;font-weight:700;font-size:16px">${parts[0]}</td>
          <td style="color:#f0883e;font-weight:700;font-size:16px">${parts[1]}</td>
        </tr>`;
      }
    }
    // Tennis: show sets won total
    if (useSetLabel && ev.ss && sport !== 'volleyball') {
      const parts = ev.ss.split('-');
      if (parts.length === 2) {
        html += `<tr style="border-top:2px solid #30363d">
          <td style="font-weight:700;color:#e6edf3">Sets vencidos</td>
          <td style="color:#58a6ff;font-weight:700;font-size:15px">${parts[0]}</td>
          <td style="color:#f0883e;font-weight:700;font-size:15px">${parts[1]}</td>
        </tr>`;
      }
    }

    html += `</tbody></table></div>`;
    body.innerHTML = html;
  }

  else if (tab === 'ai') {
    renderAITab();
  }

  else if (tab === 'json') {
    body.innerHTML = `<pre style="font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-all">${syntaxHighlight(JSON.stringify(ev, null, 2))}</pre>`;
  }
}

async function renderAITab() {
  const body = document.getElementById('modal-body');
  const ev = modalEvent;
  if (!ev) return;

  body.innerHTML = `
    <div class="ai-loading">
      <div class="spinner"></div>
      <span>Analisando partida com Grok AI...</span>
    </div>`;

  try {
    const res = await fetch(BASE + '/api/analysis/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ev),
    });
    const data = await res.json();

    if (data.error) {
      body.innerHTML = `<div class="ai-error">Erro: ${data.error}</div>`;
      return;
    }

    body.innerHTML = `<div class="ai-analysis">${mdToHtml(data.analysis)}</div>`;
  } catch (e) {
    body.innerHTML = `<div class="ai-error">Falha ao conectar: ${e.message}</div>`;
  }
}

function mdToHtml(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h4 class="ai-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="ai-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="ai-h2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(?!<[hup])/m, '<p>')
    .concat('</p>');
}

// Init
const firstBtn = document.querySelector('.endpoint-btn');
selectEndpoint(firstBtn);