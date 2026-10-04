import React from 'react';
import Modal from './Modal.jsx';
import { MERCHANTS } from '../data/merchants.js';
import { describe } from '../core/condition.js';

const CATEGORY_OF = Object.fromEntries(MERCHANTS.map((m) => [m.name, m.category]));

// 증여 실질 입증 리포트 — "이 자산은 자녀가 직접 사용했습니다"를 원장으로 뒷받침한다.
export default function ProofReport({ ledger, cond, onClose }) {
  const approved = ledger.filter((e) => e.result === '승인');
  const blocked = ledger.filter((e) => e.result === '차단');
  const total = approved.reduce((s, e) => s + e.amount, 0);

  const byCat = {};
  approved.forEach((e) => {
    const c = CATEGORY_OF[e.merchant] || '기타';
    byCat[c] = (byCat[c] || 0) + e.amount;
  });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const period = approved.length
    ? `${new Date(approved[0].ts).toLocaleDateString()} ~ ${new Date(approved[approved.length - 1].ts).toLocaleDateString()}`
    : '-';

  return (
    <Modal title="증여 실질 입증 리포트" onClose={onClose} wide>
      <div className="proof">
        <div className="proof-stamp">도담월렛 · 조건부 지출 증빙</div>
        <p className="proof-lead">
          아래 지출은 전부 <b>자녀 명의 지급수단</b>에서, 부모가 사전에 설정한 조건 범위 안에서만 실행되었습니다.
          조건 밖 시도는 실행되지 않고 차단 기록으로 남았습니다.
        </p>

        <table className="proof-table">
          <tbody>
            <tr><th>대상 기간</th><td>{period}</td></tr>
            <tr><th>설정 조건</th><td>{cond ? describe(cond) : '-'}</td></tr>
            <tr><th>지출 합계</th><td><b>{total.toLocaleString()}원</b> (승인 {approved.length}건)</td></tr>
            <tr><th>차단 기록</th><td>{blocked.length}건 — 조건 밖 시도가 실행되지 않았음의 증거</td></tr>
            <tr><th>사용 주체</th><td>100% 자녀 명의 지급수단</td></tr>
            <tr><th>원장 서명</th><td className="mono">해시 체인 {ledger.length}블록 · 최종 {ledger.length ? ledger[ledger.length - 1].hash.slice(0, 24) + '…' : '-'}</td></tr>
          </tbody>
        </table>

        <h4 className="proof-h">업종별 사용 분포</h4>
        {cats.length === 0 && <p className="muted small">승인된 지출이 없습니다.</p>}
        {cats.map(([c, v]) => (
          <div key={c} className="bar-row">
            <span className="bar-name">{c}</span>
            <span className="bar-track"><span className="bar-fill" style={{ width: `${(v / total) * 100}%` }} /></span>
            <span className="bar-val">{v.toLocaleString()}원</span>
          </div>
        ))}

        <h4 className="proof-h">차단 사유 내역</h4>
        {blocked.length === 0 && <p className="muted small">차단된 시도가 없습니다.</p>}
        <ul className="cond-list">
          {blocked.map((e) => (
            <li key={e.seq}>#{e.seq} {e.merchant} {e.amount.toLocaleString()}원 — {e.reason}</li>
          ))}
        </ul>

        <p className="proof-foot">
          본 리포트의 각 항목은 해시 체인으로 연결된 원장에서 생성되었으며, 한 건이라도 수정되면 체인 검증이 실패합니다.
        </p>
        <div className="row no-print">
          <button className="primary" onClick={() => window.print()}>인쇄 / PDF 저장</button>
          <button onClick={onClose}>닫기</button>
        </div>
      </div>
    </Modal>
  );
}
