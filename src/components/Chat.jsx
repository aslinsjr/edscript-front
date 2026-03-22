import { useState, useEffect, useRef } from 'react';
import { usePreferences } from '../contexts/PreferencesContext.jsx';
import { useCurrentEvents } from '../contexts/CurrentEventsContext.jsx';
import { sendChat, fetchEvents } from '../api/client.js';
import { SPORTS } from '../constants/sports.js';
import './Chat.css';

const SUGGESTIONS_HOME = [
  'Quem tem mais chance de vencer agora?',
  'Qual esporte está mais movimentado hoje?',
  'Me explica o que está acontecendo nos jogos ao vivo',
  'Quais jogos encerrados tiveram viradas?',
  'Quais são os próximos jogos mais esperados?',
];

const SUGGESTIONS_INPLAY = [
  'Quem tem mais chance de vencer agora?',
  'Qual time está dominando a partida?',
  'Me explica o que está acontecendo nos jogos',
];

const SUGGESTIONS_UPCOMING = [
  'Quais são os favoritos nos próximos jogos?',
  'Quais partidas prometem ser mais equilibradas?',
  'Me dá um resumo dos confrontos agendados',
];

const SUGGESTIONS_ENDED = [
  'Quais jogos tiveram as maiores viradas?',
  'Quem foram os destaques dos jogos encerrados?',
  'Houve alguma surpresa nos resultados de hoje?',
];

function inline(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/`(.+?)`/g,       '<code>$1</code>');
}

function renderChat(text) {
  const lines = text.split('\n');
  const out = [];
  let listBuf = [];

  function flushList(key) {
    if (!listBuf.length) return;
    out.push(
      <ul key={`ul-${key}`} className="chat-list">
        {listBuf.map((t, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inline(t) }} />
        ))}
      </ul>
    );
    listBuf = [];
  }

  lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) { flushList(i); return; }

    if (/^#{1,3}\s/.test(t)) {
      flushList(i);
      out.push(
        <p key={i} className="chat-heading"
          dangerouslySetInnerHTML={{ __html: inline(t.replace(/^#{1,3}\s/, '')) }} />
      );
      return;
    }

    if (t.startsWith('- ') || t.startsWith('* ') || /^\d+\.\s/.test(t)) {
      listBuf.push(t.replace(/^[-*]\s|^\d+\.\s/, ''));
      return;
    }

    flushList(i);
    out.push(
      <p key={i} className="chat-para"
        dangerouslySetInnerHTML={{ __html: inline(t) }} />
    );
  });

  flushList('end');
  return out;
}

function Message({ msg }) {
  if (msg.role === 'user') {
    return <div className="chat-msg chat-msg-user">{msg.text}</div>;
  }
  return (
    <div className="chat-msg chat-msg-ai">
      <span className="chat-msg-icon">✦</span>
      <div className="chat-msg-text">{renderChat(msg.text)}</div>
    </div>
  );
}

export default function Chat({ onClose }) {
  const { prefs } = usePreferences();
  const { currentEvents, currentMode } = useCurrentEvents();
  const isPageContext = currentEvents !== null;
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [events,  setEvents]    = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  async function loadEvents() {
    // Se há contexto de página, usa os eventos exibidos na tela
    if (isPageContext) return currentEvents || [];

    // Home: busca 20 eventos diversificados dos esportes favoritos
    const sportIds = prefs.favoriteSports.slice(0, 5);
    const results = await Promise.allSettled(
      sportIds.map(id => fetchEvents('/api/events/inplay', { sport_id: id }))
    );
    return results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => {
        const d = r.value;
        return Array.isArray(d) ? d : (d.results || d.events || d.data || []);
      })
      .slice(0, 20);
  }

  useEffect(() => {
    loadEvents().then(setEvents).catch(() => {});
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const freshEvents = await loadEvents().catch(() => events);
      setEvents(freshEvents);
      const data = await sendChat({
        message:        msg,
        sportIds:       prefs.favoriteSports,
        knowledgeLevel: prefs.knowledgeLevel,
        events:         freshEvents,
      });
      const reply = data.reply || data.message || data.text || JSON.stringify(data);
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `Erro: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  const favoriteSportNames = SPORTS
    .filter(s => prefs.favoriteSports.includes(s.id))
    .map(s => s.emoji)
    .slice(0, 6)
    .join(' ');

  const levelLabel = { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' };

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-header-title">✦ Assistente IA</span>
          <span className="chat-header-meta">
            {isPageContext
              ? `📺 ${currentEvents?.length ?? 0} eventos da tela · ${levelLabel[prefs.knowledgeLevel]}`
              : `${favoriteSportNames} · ${levelLabel[prefs.knowledgeLevel]}`
            }
          </span>
        </div>
        <button className="chat-close" onClick={onClose}>✕</button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">✦</div>
            <p>Olá! Sou seu assistente esportivo com IA. Pergunte sobre os jogos, probabilidades, times e muito mais.</p>
            <div className="chat-suggestions">
              {(
                !isPageContext       ? SUGGESTIONS_HOME     :
                currentMode === 'upcoming' ? SUGGESTIONS_UPCOMING :
                currentMode === 'ended'    ? SUGGESTIONS_ENDED    :
                SUGGESTIONS_INPLAY
              ).map((s, i) => (
                <button key={i} className="chat-suggestion" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div className="chat-msg chat-msg-ai">
            <span className="chat-msg-icon">✦</span>
            <div className="chat-typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="chat-footer">
        <input
          ref={inputRef}
          className="chat-input"
          placeholder="Pergunte algo sobre os jogos..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
        />
        <button
          className="chat-send"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
