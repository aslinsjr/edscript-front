export function timerStr(ev, sportType) {
  if (!ev.timer) return null;
  const t = ev.timer;
  const pad = n => String(n || 0).padStart(2, '0');

  if (sportType === 'basketball') {
    const q = t.q ? `Q${t.q}` : '';
    const time = t.tm !== undefined ? ` ${t.tm}:${pad(t.ts)}` : '';
    return (q + time).trim() || null;
  }

  if (sportType === 'icehockey') {
    const P = { '1': 'P1', '2': 'P2', '3': 'P3', '4': 'OT', '5': 'SO' };
    const p = t.q ? (P[t.q] || `P${t.q}`) : '';
    const time = t.tm !== undefined ? ` ${t.tm}:${pad(t.ts)}` : '';
    return (p + time).trim() || null;
  }

  if (t.tm === undefined || t.tm === null) return null;
  let s = `${t.tm}'`;
  if (t.ta && parseInt(t.ta) > 0) s += `+${t.ta}`;
  return s;
}

export function getPeriodLabels(sportType) {
  if (sportType === 'basketball') {
    return {
      '1': '1º Quarto',
      '2': '2º Quarto',
      '3': '3º Quarto',
      '4': '4º Quarto',
      '5': 'OT 1',
      '6': 'OT 2',
      '7': 'Total',
    };
  }
  if (sportType === 'icehockey') {
    return {
      '1': '1º Período',
      '2': '2º Período',
      '3': '3º Período',
      '4': 'Prorrogação',
      '5': 'Total',
    };
  }
  if (sportType === 'handball') {
    return {
      '1': '1º Tempo',
      '2': '2º Tempo',
      '3': 'Prorrogação Extra',
      '4': 'Total',
    };
  }
  return {
    '1': '1º Tempo',
    '2': '2º Tempo',
    '3': 'Prorrogação',
    '4': 'Pênaltis',
  };
}

export function getPeriodLabel(ev, sportType) {
  if ((sportType === 'soccer' || sportType === 'handball') && ev.timer?.md) {
    return ev.timer.md === 1 ? '1º Tempo' : ev.timer.md === 2 ? '2º Tempo' : `Período ${ev.timer.md}`;
  }
  if (sportType === 'basketball' && ev.timer?.q) {
    const q = parseInt(ev.timer.q);
    return q <= 4 ? `${q}º Quarto` : `Prorrogação ${q - 4}`;
  }
  if (sportType === 'icehockey' && ev.timer?.q) {
    const P = { '1': '1º Período', '2': '2º Período', '3': '3º Período', '4': 'Prorrogação', '5': 'Shootout' };
    return P[ev.timer.q] || `Período ${ev.timer.q}`;
  }
  return null;
}

export function getTotalKey(sportType) {
  return { basketball: '7', icehockey: '5', handball: '4' }[sportType] || null;
}
