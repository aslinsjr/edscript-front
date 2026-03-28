import { useState, useEffect, useRef } from 'react';
import { SPORTS } from '../constants/sports.js';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import { fetchEvents, sendChat, analyzeEvent } from '../api/client.js';
import './AssistantChat.css';

// ── Reutiliza a mesma lógica de parsing do AITab ──────────────────────────────

const SECTION_MAP = [
  { patterns: ['match context', 'contexto'],                 icon: '📋', title: 'Contexto' },
  { patterns: ['momentum'],                                  icon: '📈', title: 'Momentum' },
  { patterns: ['likely outcome', 'probabilidade', 'outcome'],icon: '🎯', title: 'Probabilidades' },
  { patterns: ['key factor', 'fator'],                       icon: '⚡', title: 'Fatores-chave' },
  { patterns: ['recommendation', 'recomenda'],               icon: '✅', title: 'Recomendação' },
];

function resolveSection(rawTitle) {
  const lower = rawTitle.toLowerCase();
  for (const s of SECTION_MAP) {
    if (s.patterns.some(p => lower.includes(p))) return s;
  }
  return { icon: '•', title: rawTitle };
}

function parseSections(text) {
  if (!text) return [];
  const lines  = text.split('\n');
  const result = [];
  let current  = null;

  for (const line of lines) {
    const t = line.trim();
    const numbered  = t.match(/^\d+\.\s+(.+)/);
    const heading   = t.match(/^#{1,4}\s+(.+)/);
    const boldLine  = t.match(/^[•\-\*]?\s*\*{2}([^*]+)\*{2}\s*$/);
    const rawTitle  = numbered?.[1] || heading?.[1] || boldLine?.[1] || null;

    if (rawTitle) {
      if (current) result.push(current);
      current = { rawTitle: rawTitle.replace(/^\*{2}(.+?)\*{2}$/, '$1').trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) result.push(current);
  if (result.length === 0) return [{ rawTitle: 'Análise', lines }];
  return result;
}

function inlineMarkdown(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

function countryFlag(cc) {
  if (!cc) return '🌐';
  return cc.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

function formatEventTime(timestamp) {
  const date = new Date(Number(timestamp) * 1000);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${day} ${time}`;
}

function groupByLeague(events) {
  const map = new Map();
  for (const ev of events) {
    const key = ev.league?.id || 'unknown';
    if (!map.has(key)) map.set(key, { league: ev.league, events: [] });
    map.get(key).events.push(ev);
  }
  return Array.from(map.values());
}

function extractIntro(reply) {
  const lines = reply.split('\n');
  const intro = [];
  for (const line of lines) {
    if (line.includes('[jogo:') || line.trimStart().startsWith('- ')) break;
    if (line.trim()) intro.push(line.trim());
  }
  return intro.join(' ').trim();
}

// ── Componente principal ──────────────────────────────────────────────────────

// ── Input isolado: não re-renderiza AssistantChat ao digitar ─────────────────

function ChatInput({ onSend, disabled }) {
  const [input, setInput] = useState('');
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); }, []);

  function submit() {
    const msg = input.trim();
    if (!msg || disabled) return;
    setInput('');
    onSend(msg);
  }

  return (
    <div className="ac-footer">
      <div className={`ac-input-wrap${disabled ? ' busy' : ''}`}>
        <input
          ref={ref}
          className="ac-input"
          placeholder="Pergunte sobre qualquer jogo, time ou competição…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          disabled={disabled}
        />
        <button
          className="ac-send"
          onClick={submit}
          disabled={disabled || !input.trim()}
          aria-label="Enviar"
        >
          ↑
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AssistantChat({ onEventSelect }) {
  const { prefs }               = usePreferences();
  const [messages, setMessages] = useState([]);
  const [busy,     setBusy]     = useState(false);
  const [ready,    setReady]    = useState(false);
  const bodyRef = useRef(null);
  const liveRef = useRef([]);

  // ── scroll to bottom on new messages
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 60);
  }, [messages]);

  // ── fetch live events & initial greeting
  useEffect(() => {
    const favSports = SPORTS.filter(s => prefs.favoriteSports.includes(s.id)).slice(0, 4);

    Promise.all(
      favSports.map(s =>
        fetchEvents('/api/events/inplay', { sport_id: s.id })
          .then(d => {
            const arr = Array.isArray(d) ? d : (d.results || d.events || d.data || []);
            return arr.slice(0, 2).map(e => ({ ...e, _sport: s }));
          })
          .catch(() => [])
      )
    ).then(results => {
      const live = results.flat();
      liveRef.current = live;

      if (live.length > 0) {
        setMessages([
          {
            id: 1, role: 'bot', type: 'text',
            content: `${greeting()}! Encontrei **${live.length} jogo${live.length > 1 ? 's' : ''}** ao vivo nos seus esportes. Quer que eu analise algum?`,
          },
          { id: 2, role: 'bot', type: 'chips', events: live },
        ]);
      } else {
        setMessages([
          {
            id: 1, role: 'bot', type: 'text',
            content: `${greeting()}! Não há jogos ao vivo agora nos seus esportes. Me pergunte sobre qualquer time, jogo ou competição.`,
          },
        ]);
      }
      setReady(true);
    });
  }, []);

  function addMsg(msg) {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);
  }

  function replaceLoading(replacement) {
    setMessages(prev => {
      const copy = [...prev];
      const idx  = copy.findLastIndex(m => m.type === 'loading');
      if (idx !== -1) copy[idx] = { ...copy[idx], ...replacement };
      return copy;
    });
  }

  // ── Analyze a specific event
  async function handleAnalyze(ev) {
    const home = ev.home?.name || '—';
    const away = ev.away?.name || '—';
    addMsg({ role: 'user', type: 'text', content: `Analisar ${home} × ${away}` });
    addMsg({ role: 'bot',  type: 'loading' });
    setBusy(true);

    try {
      const result   = await analyzeEvent(ev, prefs.knowledgeLevel);
      const text     = result?.analysis || result?.text || result?.content || JSON.stringify(result);
      const sections = parseSections(text);
      replaceLoading({ type: 'analysis', event: ev, sport: ev._sport, sections });
    } catch {
      replaceLoading({ type: 'text', content: 'Não consegui analisar esse jogo agora. Tente novamente.' });
    } finally {
      setBusy(false);
    }
  }

  // ── Send a free text message (mesma lógica do Chat antigo)
  async function handleSend(msg) {
    if (!msg || busy) return;
    addMsg({ role: 'user', type: 'text', content: msg });
    addMsg({ role: 'bot',  type: 'loading' });
    setBusy(true);

    try {
      const data  = await sendChat({
        message:        msg,
        sportIds:       prefs.favoriteSports,
        knowledgeLevel: prefs.knowledgeLevel,
      });
      const reply           = data.reply || data.message || data.text || JSON.stringify(data);
      const mentionedEvents = data.events || [];
      if (mentionedEvents.length >= 3) {
        const intro = extractIntro(reply);
        replaceLoading({ type: 'event-list', intro, mentionedEvents });
      } else {
        replaceLoading({ type: 'text', content: reply, mentionedEvents });
      }
    } catch (err) {
      replaceLoading({ type: 'text', content: `Erro: ${err.message}` });
    } finally {
      setBusy(false);
    }
  }

  // ── Renders ───────────────────────────────────────────────────────────────

  function BotText({ content, mentionedEvents = [] }) {
    // [jogo:ID] tem prioridade — split por jogo primeiro para evitar que
    // marcadores dentro de **bold** sejam engolidos pelo regex de negrito
    const segments = content.split(/(\[jogo:\w+\])/g);

    function renderText(text) {
      // Remove ** residuais nas bordas (quando o modelo colocou [ID] dentro de **)
      const clean = text.replace(/\*{2}/g, seg => seg);
      return clean.split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        return p;
      });
    }

    return (
      <div className="ac-bubble bot">
        {segments.map((seg, i) => {
          const jogoMatch = seg.match(/^\[jogo:(\w+)\]$/);
          if (jogoMatch) {
            const id    = jogoMatch[1];
            const ev    = mentionedEvents?.find(e => String(e.id) === id);
            const home  = ev?.home?.name || '?';
            const away  = ev?.away?.name || '?';
            const sport = ev?._sport || SPORTS.find(s => String(s.id) === String(ev?.sport_id));
            return (
              <button
                key={i}
                className="ac-event-ref"
                onClick={() => ev && onEventSelect?.(ev, sport)}
                title={ev ? `${home} × ${away}` : id}
              >
                {ev ? `${home} × ${away} ↗` : `Ver jogo ↗`}
              </button>
            );
          }
          return <span key={i}>{renderText(seg)}</span>;
        })}
      </div>
    );
  }

  function EventChips({ events }) {
    return (
      <div className="ac-chips">
        {events.map((ev, i) => {
          const home  = ev.home?.name || '—';
          const away  = ev.away?.name || '—';
          return (
            <button key={i} className="ac-chip" onClick={() => !busy && handleAnalyze(ev)}>
              <span className="ac-chip-sport">{ev._sport?.emoji}</span>
              <div className="ac-chip-info">
                <span className="ac-chip-teams">{home} × {away}</span>
                <span className="ac-chip-meta">
                  {ev.ss && <span className="ac-chip-score">{ev.ss}</span>}
                  {ev.league?.name && <span className="ac-chip-league">{ev.league.name}</span>}
                </span>
              </div>
              <span className="ac-chip-live">● AO VIVO</span>
            </button>
          );
        })}
      </div>
    );
  }

  function EventListDropdown({ intro, mentionedEvents }) {
    const groups = groupByLeague(mentionedEvents);
    const [open, setOpen] = useState(() => new Set(groups.map(g => g.league?.id)));

    function toggle(id) {
      setOpen(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }

    return (
      <div className="ac-event-list">
        {intro && <p className="ac-event-list-intro">{intro}</p>}
        {groups.map(({ league, events }) => {
          const id       = league?.id || 'unknown';
          const isOpen   = open.has(id);
          const flag     = countryFlag(league?.cc);
          return (
            <div key={id} className="ac-league-group">
              <button className="ac-league-header" onClick={() => toggle(id)}>
                <span className="ac-league-flag">{flag}</span>
                <span className="ac-league-name">{league?.name || 'Liga desconhecida'}</span>
                <span className="ac-league-count">{events.length}</span>
                <span className={`ac-league-chevron${isOpen ? ' open' : ''}`}>›</span>
              </button>
              {isOpen && (
                <div className="ac-league-games">
                  {events.map(ev => {
                    const home  = ev.home?.name || '—';
                    const away  = ev.away?.name || '—';
                    const sport = ev._sport || SPORTS.find(s => String(s.id) === String(ev.sport_id));
                    return (
                      <button
                        key={ev.id}
                        className="ac-game-row"
                        onClick={() => onEventSelect?.({ ...ev, _sport: sport }, sport)}
                      >
                        <span className="ac-game-sport">{sport?.emoji}</span>
                        <span className="ac-game-teams">{home} <span className="ac-game-vs">×</span> {away}</span>
                        <span className="ac-game-time">{formatEventTime(ev.time)}</span>
                        <span className="ac-game-analyze">Ver ↗</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function AnalysisCard({ msg }) {
    const home  = msg.event?.home?.name || '—';
    const away  = msg.event?.away?.name || '—';
    const score = msg.event?.ss;
    return (
      <div className="ac-analysis">
        <div className="ac-analysis-header">
          <span className="ac-analysis-sport">{msg.sport?.emoji}</span>
          <span className="ac-analysis-match">{home} × {away}</span>
          {score && <span className="ac-analysis-score">{score}</span>}
          {onEventSelect && (
            <button
              className="ac-analysis-expand"
              onClick={() => onEventSelect(msg.event, msg.sport)}
            >
              Ver completo ↗
            </button>
          )}
        </div>
        {msg.sections.map((s, i) => {
          const { icon, title } = resolveSection(s.rawTitle);
          const isRec = title === 'Recomendação';
          return (
            <div key={i} className={`ac-analysis-section${isRec ? ' highlight' : ''}`}>
              <div className="ac-analysis-section-title">{icon} {title}</div>
              {s.lines.filter(l => l.trim()).map((line, j) => {
                const t = line.trim();
                const isBullet = t.startsWith('- ') || t.startsWith('* ');
                const text     = isBullet ? t.slice(2) : t;
                return (
                  <p
                    key={j}
                    className={`ac-analysis-line${isBullet ? ' bullet' : ''}`}
                    dangerouslySetInnerHTML={{ __html: inlineMarkdown(text) }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  function renderMsg(msg) {
    if (msg.role === 'user') {
      return (
        <div key={msg.id} className="ac-row user">
          <div className="ac-bubble user">{msg.content}</div>
        </div>
      );
    }

    return (
      <div key={msg.id} className="ac-row bot">
        <div className="ac-avatar">✦</div>
        {msg.type === 'loading'     && <div className="ac-bubble bot ac-typing"><span /><span /><span /></div>}
        {msg.type === 'text'        && <BotText content={msg.content} mentionedEvents={msg.mentionedEvents} />}
        {msg.type === 'chips'       && <EventChips events={msg.events} />}
        {msg.type === 'analysis'    && <AnalysisCard msg={msg} />}
        {msg.type === 'event-list'  && <EventListDropdown intro={msg.intro} mentionedEvents={msg.mentionedEvents} />}
      </div>
    );
  }

  return (
    <div className="ac-root">

      {/* Messages */}
      <div className="ac-body" ref={bodyRef}>
        {!ready && (
          <div className="ac-row bot">
            <div className="ac-avatar">✦</div>
            <div className="ac-bubble bot ac-typing"><span /><span /><span /></div>
          </div>
        )}
        {messages.map(renderMsg)}
      </div>

      <ChatInput onSend={handleSend} disabled={busy} />

    </div>
  );
}
