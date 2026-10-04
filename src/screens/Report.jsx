import React, { useState } from 'react';
import { verify, tamper } from '../core/ledger.js';
import { monthSpent } from '../core/judge.js';
import ProofReport from '../components/ProofReport.jsx';

export default function Report({ state, dispatch }) {
  const { ledger, cond, swept } = state;
  const [status, setStatus] = useState(null);   // null | 'ok' | 'bad'
  const [view, setView] = useState(ledger);     // 변조 시연 시 교체되는 사본
  const [tampered, setTampered] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [handoff, setHandoff] = useState(false);

  const spent = monthSpent(ledger);
  const unused = cond ? Math.max(0, cond.monthlyLimit - spent) : 0;

  async function check() { setStatus((await verify(view)) ? 'ok' : 'bad'); }

  function doTamper() {
    setView(tamper(view, 0));
    setTampered(true);
    setStatus(null);
  }
  function restore() {
    setView(ledger);
    setTampered(false);
    setStatus(null);
  }

  return (
    <div className="report">
      <section className="panel">
        <h2>지출 원장 — 해시 체인</h2>
        <p className="muted small">모든 블록은 이전 블록의 해시로 연결됩니다. 하나라도 고치면 그 뒤 전체가 깨집니다.</p>
        <div className="chain">
          {view.length === 0 && <div className="muted">아직 거래가 없습니다.</div>}
          {view.map((b, i) => (
            <React.Fragment key={b.seq}>
              {i > 0 && <div className="chain-link">→</div>}
              <div className={`block ${b.result === '승인' ? 'ok' : 'no'} ${tampered && i === 0 ? 'tampered' : ''}`}>
                <div className="block-seq">#{b.seq}</div>
                <div className="block-body">
                  <b>{b.merchant}</b> {b.amount.toLocaleString()}원 · {b.result}
                  {b.result === '차단' && <div className="block-reason">{b.reason}</div>}
                  <div className="hash">prev {b.prevHash.slice(0, 8)}…</div>
                  <div className="hash">self {b.hash.slice(0, 8)}…</div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="row">
          <button className="primary" onClick={check} disabled={!view.length}>체인 검증</button>
          <button onClick={doTamper} disabled={!view.length || tampered}>변조 시연 (1번 블록 +1만원)</button>
          <button onClick={restore} disabled={!tampered}>원본 복원</button>
          {status === 'ok' && <span className="chip ok">✓ 무결성 확인 — 변조 없음</span>}
          {status === 'bad' && <span className="chip bad">✕ 검증 실패 — 변조 감지</span>}
        </div>
        {tampered && status === null && (
          <p className="muted small">1번 블록 금액을 몰래 고쳤습니다. 이제 [체인 검증]을 눌러 보세요.</p>
        )}
      </section>

      <section className="panel">
        <h2>증여 실질 입증</h2>
        <p className="muted small">"이 자산은 자녀가 직접 사용했습니다" — 원장에서 자동 생성되는 세무 증빙</p>
        <ul className="cond-list">
          <li>기간 지출 합계: <b>{spent.toLocaleString()}원</b>
            (승인 {ledger.filter((e) => e.result === '승인').length}건 / 차단 {ledger.filter((e) => e.result === '차단').length}건)</li>
          <li>사용 주체: 100% 자녀 명의 지급수단</li>
          <li>원장 서명: 해시 체인 {ledger.length}블록 연결</li>
        </ul>
        <button className="primary" onClick={() => setShowProof(true)} disabled={!ledger.length}>
          증빙 리포트 열기 →
        </button>
      </section>

      <div className="cards2">
        <section className="panel sweep">
          <h3>이번 달 미사용 {unused.toLocaleString()}원</h3>
          {swept === null ? (
            <>
              <p>월말에 <b>씨앗적금</b>으로 옮깁니다. 낙전 대신 저축이 기본값입니다.</p>
              <button className="primary" onClick={() => dispatch({ type: 'SWEEP', amount: unused })} disabled={!unused}>
                씨앗적금으로 이동
              </button>
            </>
          ) : (
            <>
              <p><b>{swept.toLocaleString()}원</b>이 씨앗적금으로 이동했습니다.</p>
              <p className="muted small">쓰지 않은 용돈이 사라지지 않고 아이 이름의 저축으로 남습니다.</p>
              <span className="chip ok">이동 완료</span>
            </>
          )}
        </section>

        <section className="panel handoff">
          <h3>자율성 이양 제안</h3>
          <p>내년 중학교 진학 — <b>지정 가맹점 방식 → 카테고리 방식</b>으로 전환할까요? 아이가 크면 조건도 자랍니다.</p>
          {handoff ? (
            <span className="chip">다음 달부터 카테고리 방식으로 전환 예약됨</span>
          ) : (
            <button onClick={() => setHandoff(true)}>제안 수락</button>
          )}
        </section>
      </div>

      {showProof && <ProofReport ledger={ledger} cond={cond} onClose={() => setShowProof(false)} />}
    </div>
  );
}
