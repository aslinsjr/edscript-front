import { useState, useEffect } from 'react';
import { analyzeEvent } from '../../api/client.js';

function renderMarkdown(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  function flushList(key) {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ margin: '6px 0 10px 18px', padding: 0, color: '#c9d1d9' }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ marginBottom: 4, fontSize: 14, lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }}
            />
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  function inlineMarkdown(str) {
    return str
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e6edf3">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  lines.forEach((line, i) => {
    if (line.startsWith('#### ')) {
      flushList(i);
      elements.push(
        <div key={i} className="ai-h4">{line.slice(5)}</div>
      );
    } else if (line.startsWith('### ')) {
      flushList(i);
      elements.push(
        <div key={i} className="ai-h3">{line.slice(4)}</div>
      );
    } else if (line.startsWith('## ')) {
      flushList(i);
      elements.push(
        <div key={i} className="ai-h2">{line.slice(3)}</div>
      );
    } else if (line.startsWith('# ')) {
      flushList(i);
      elements.push(
        <div key={i} className="ai-h2">{line.slice(2)}</div>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
    } else if (line.trim() === '') {
      flushList(i);
    } else {
      flushList(i);
      elements.push(
        <p key={i}
          style={{ margin: '6px 0', fontSize: 14, lineHeight: 1.75, color: '#c9d1d9' }}
          dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }}
        />
      );
    }
  });

  flushList('end');
  return elements;
}

export default function AITab({ ev, sport }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
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
    const text = result.analysis || result.text || result.content || JSON.stringify(result);
    return (
      <div className="ai-analysis">
        {renderMarkdown(text)}
      </div>
    );
  }

  return null;
}
