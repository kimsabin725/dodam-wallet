import React from 'react';

// 이번 달 남은 용돈 게이지. 소진이 가까우면 색이 바뀐다.
export default function Gauge({ remain, limit }) {
  const pct = limit ? Math.max(0, Math.min(100, (remain / limit) * 100)) : 0;
  const tone = pct <= 0 ? 'empty' : pct < 25 ? 'low' : 'ok';
  return (
    <div className="gauge-wrap">
      <div className="gauge-label">
        이번 달 남은 용돈 <b>{remain.toLocaleString()}원</b>
        <span className="muted small"> / {limit.toLocaleString()}원</span>
        {pct <= 0 && <span className="chip bad" style={{ marginLeft: 6 }}>한도 소진</span>}
      </div>
      <div className="gauge"><div className={`gauge-fill ${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
