import { useState, useEffect } from 'react';
import { analyzeEvent } from '../../api/client.js';
import './AITab.css';

// ─── mapeamento de seções ─────────────────────────────────────────────────────

const SECTION_MAP = [
  { patterns: ['match context', 'contexto'],        icon: '📋', title: 'Contexto do Jogo' },
  { patterns: ['momentum'],                          icon: '📈', title: 'Momentum' },
  { patterns: ['likely outcome', 'probabilidade', 'outcome'], icon: '🎯', title: 'Probabilidades' },
  { patterns: ['key factor', 'fator'],               icon: '⚡', title: 'Fatores-chave' },
  { patterns: ['recommendation', 'recomenda'],       icon: '✅', title: 'Recomendação' },
];

function resolveSection(rawTitle) {
  const lower = rawTitle.toLowerCase();
  for (const s of SECTION_MAP) {
    if (s.patterns.some(p => lower.includes(p))) return s;
  }
  return { icon: '•', title: rawTitle };
}

// ─── parser: texto → [{title, content}] ──────────────────────────────────────

function parseSections(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // "1. Título" ou "## Título"
    const numbered = trimmed.match(/^\d+\.\s+(.+)/);
    const heading  = trimmed.match(/^#{1,4}\s+(.+)/);
    // "• **TÍTULO**" ou "* **TÍTULO**" ou "**TÍTULO**" (linha só com negrito)
    const boldBullet = trimmed.match(/^[•\-\*]?\s*\*{2}([^*]+)\*{2}\s*$/);

    const rawTitle = numbered?.[1] || heading?.[1] || boldBullet?.[1] || null;

    if (rawTitle) {
      if (current) sections.push(current);
      // remove ** que a IA coloca no título
      const cleanTitle = rawTitle.trim().replace(/^\*{2}(.+?)\*{2}\s*$/, '$1');
      current = { rawTitle: cleanTitle, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  // fallback: sem seções detectadas → tudo como bloco único
  if (sections.length === 0) {
    return [{ rawTitle: 'Análise', lines }];
  }

  return sections;
}

// ─── renderiza linha de probabilidade com barra ───────────────────────────────

function ProbabilityRow({ text }) {
  const match = text.match(/^(.+?):\s*([\d,.]+)%(.*)$/);
  if (!match) return <p className="ai-body-text">{text}</p>;

  const [, label, pctStr, rest] = match;
  const pct = parseFloat(pctStr.replace(',', '.'));

  const color = pct >= 50 ? '#3fb950' : pct >= 30 ? '#f0883e' : '#8b949e';

  return (
    <div className="ai-prob-row">
      <div className="ai-prob-header">
        <span className="ai-prob-label">{label.trim()}</span>
        <span className="ai-prob-pct" style={{ color }}>{pct}%{rest}</span>
      </div>
      <div className="ai-prob-bar-bg">
        <div className="ai-prob-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── renderiza conteúdo de uma seção ─────────────────────────────────────────

function inlineMarkdown(str) {
  return str
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e6edf3">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function SectionContent({ lines, isOutcomes }) {
  const items = [];
  let listBuf = [];

  function flushList(key) {
    if (listBuf.length === 0) return;
    items.push(
      <ul key={`ul-${key}`} className="ai-list">
        {listBuf.map((t, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineMarkdown(t) }} />
        ))}
      </ul>
    );
    listBuf = [];
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(i); return; }

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');

    if (isOutcomes) {
      flushList(i);
      // bullets de probabilidade: "- Vitória X: 55% ..."
      const probText = isBullet ? trimmed.slice(2).trim() : trimmed;
      items.push(<ProbabilityRow key={i} text={probText} />);
      return;
    }

    if (isBullet) {
      flushList(i);
      listBuf.push(trimmed.slice(2));
      return;
    }

    flushList(i);
    items.push(
      <p key={i} className="ai-body-text"
        dangerouslySetInnerHTML={{ __html: inlineMarkdown(trimmed) }} />
    );
  });

  flushList('end');
  return <>{items}</>;
}

// ─── card de seção ────────────────────────────────────────────────────────────

function SectionCard({ rawTitle, lines }) {
  const { icon, title } = resolveSection(rawTitle);
  const isOutcomes      = title === 'Probabilidades';
  const isRecommend     = title === 'Recomendação';

  return (
    <div className={`ai-card${isRecommend ? ' ai-card-highlight' : ''}`}>
      <div className="ai-card-header">
        <span className="ai-card-icon">{icon}</span>
        <span className="ai-card-title">{title}</span>
      </div>
      <div className="ai-card-body">
        <SectionContent lines={lines} isOutcomes={isOutcomes} />
      </div>
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function AITab({ ev }) {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setResult(null);
    setErrMsg('');

    analyzeEvent(ev)
      .then(data => {
        if (cancelled) return;
        setResult(data);
        setStatus('done');
      })
      .catch(err => {
        if (cancelled) return;
        setErrMsg(err.message);
        setStatus('error');
      });

    return () => { cancelled = true; };
  }, [ev.id]);

  if (status === 'loading') {
    return (
      <div className="ai-loading">
        <div className="spinner" />
        <span>Analisando evento com IA...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="ai-error">
        <strong>Erro ao obter análise:</strong> {errMsg}
      </div>
    );
  }

  if (status === 'done' && result) {
    const text     = result.analysis || result.text || result.content || JSON.stringify(result);
    const sections = parseSections(text);
    return (
      <div className="ai-analysis">
        {sections.map((s, i) => (
          <SectionCard key={i} rawTitle={s.rawTitle} lines={s.lines} />
        ))}
      </div>
    );
  }

  return null;
}
