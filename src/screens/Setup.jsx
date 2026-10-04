import React, { useState } from 'react';
import { toCondition } from '../ai.js';
import { describe, validate, CATEGORIES } from '../core/condition.js';
import { TEMPLATES } from '../data/templates.js';

const EXAMPLE = '분식이랑 문구점, 서점까지. 한 달에 5만원. 한 번에 만원까지. 게임은 안 돼. 우리 동네 지정한 가게에서만.';

const MODE_LABEL = {
  claude: 'Claude 온라인',
  fallback: 'AI 오프라인 모드(폴백)',
  offline: 'AI 오프라인 모드(룰 파서)',
  template: '디폴트 템플릿'
};

export default function Setup({ dispatch }) {
  const [text, setText] = useState(EXAMPLE);
  const [cond, setCond] = useState(null);   // 편집 가능한 조건 카드
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState(false);

  async function convert() {
    setBusy(true);
    const r = await toCondition(text);
    setCond(r.cond);
    setMode(r.mode);
    setBusy(false);
  }

  function useTemplate(t) {
    setCond({ ...t.cond });
    setMode('template');
    setText(`[템플릿] ${t.label} — ${t.hint}`);
  }

  // 조건 카드 직접 수정 — AI가 잘못 알아들었을 때 부모가 고칠 수 있어야 한다
  const edit = (patch) => setCond((c) => ({ ...c, ...patch }));

  function toggleCategory(cat) {
    const on = cond.categories.includes(cat);
    edit({
      categories: on ? cond.categories.filter((c) => c !== cat) : [...cond.categories, cat],
      blocked: cond.blocked.filter((c) => c !== cat)   // 허용으로 켜면 차단에서 뺀다
    });
  }
  function toggleBlocked(cat) {
    const on = cond.blocked.includes(cat);
    edit({
      blocked: on ? cond.blocked.filter((c) => c !== cat) : [...cond.blocked, cat],
      categories: cond.categories.filter((c) => c !== cat)
    });
  }

  const check = cond ? validate(cond) : { ok: false, errors: [] };

  return (
    <div className="setup">
      <section className="panel">
        <h2>부모님, 말로 조건을 정하세요</h2>
        <p className="muted">아이 앞으로 있는 돈(용돈·세뱃돈·증여 예금)은 그대로 두고, 쓰는 조건만 심습니다.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
        <div className="row">
          <button className="primary" onClick={convert} disabled={busy}>
            {busy ? '변환 중…' : 'AI로 조건 변환'}
          </button>
          {mode && <span className="chip">{MODE_LABEL[mode]}</span>}
        </div>
        <div className="templates">
          <div className="muted small">또는 연령별 추천 조건 (디폴트옵션):</div>
          {TEMPLATES.map((t) => (
            <button key={t.id} className="tpl" onClick={() => useTemplate(t)}>
              {t.label}<span className="tpl-hint">{t.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {cond && (
        <section className="panel condition-card">
          <h3>조건 카드 — 고칠 수 있습니다</h3>
          <div className="cond-desc">{describe(cond)}</div>

          <div className="field">
            <div className="field-label">허용 업종 <span className="muted small">— 여기서만 결제됩니다</span></div>
            <div className="pills">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={cond.categories.includes(c) ? 'pill on' : 'pill'}
                  onClick={() => toggleCategory(c)}
                >{c}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="field-label">차단 업종 <span className="muted small">— 지정 여부와 무관하게 막힙니다</span></div>
            <div className="pills">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={cond.blocked.includes(c) ? 'pill no' : 'pill'}
                  onClick={() => toggleBlocked(c)}
                >{c}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="switch">
              <input
                type="checkbox"
                checked={cond.whitelistOnly}
                onChange={(e) => edit({ whitelistOnly: e.target.checked })}
              />
              <span>우리 동네 <b>지정 가맹점에서만</b></span>
            </label>
          </div>

          <div className="limits">
            <label className="field">
              <div className="field-label">월 한도</div>
              <input
                className="input num" type="number" min="0" step="10000"
                value={cond.monthlyLimit}
                onChange={(e) => edit({ monthlyLimit: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <div className="field-label">회당 한도</div>
              <input
                className="input num" type="number" min="0" step="1000"
                value={cond.perTxLimit}
                onChange={(e) => edit({ perTxLimit: Number(e.target.value) })}
              />
            </label>
          </div>

          {!check.ok && (
            <ul className="errors">
              {check.errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}

          <button
            className="primary big"
            disabled={!check.ok}
            onClick={() => dispatch({ type: 'ISSUE', cond, mode })}
          >
            조건 심어서 발행하기 →
          </button>
        </section>
      )}
    </div>
  );
}
