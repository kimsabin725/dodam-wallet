import React, { useState } from 'react';
import { MERCHANTS } from '../data/merchants.js';
import { judge, monthSpent } from '../core/judge.js';
import { append } from '../core/ledger.js';
import { describe } from '../core/condition.js';
import Gauge from '../components/Gauge.jsx';
import InterestCounter from '../components/InterestCounter.jsx';
import PaySheet from '../components/PaySheet.jsx';

// 부모 자산 카드 상수 (v1.2: 이자 시연은 용돈 잔액이 아니라 '증여 원본'에서 — 수치가 성립하는 곳)
const PRINCIPAL = 20000000;
const RATE = 0.03;

export default function PayDemo({ state, dispatch }) {
  const { cond, ledger, notifications } = state;
  const [sheet, setSheet] = useState(null);   // 결제 시트에 올라온 가맹점
  const [last, setLast] = useState(null);     // { name, approved, reason, seq }
  const [busy, setBusy] = useState(false);
  const spent = monthSpent(ledger);
  const remain = Math.max(0, cond.monthlyLimit - spent);

  async function pay(merchant, amount) {
    if (busy) return;
    setBusy(true);
    const r = judge(merchant, amount, cond, ledger);
    const newLedger = await append(ledger, {
      merchant: merchant.name,
      amount,
      result: r.approved ? '승인' : '차단',
      reason: r.reason
    });
    dispatch({
      type: 'PAID',
      ledger: newLedger,
      notice: {
        id: newLedger.length, name: merchant.name, amount,
        approved: r.approved, reason: r.reason, ts: new Date().toLocaleTimeString()
      }
    });
    setLast({ name: merchant.name, approved: r.approved, reason: r.reason, seq: newLedger.length });
    setBusy(false);
    setSheet(null);
  }

  return (
    <div className="paydemo">
      {/* 아이 폰 */}
      <div className="phone child">
        <div className="phone-head">아이 폰 — 도담월렛</div>
        <div className="cond-chip">{describe(cond)}</div>
        <Gauge remain={remain} limit={cond.monthlyLimit} />
        {last && (
          <div key={last.seq} className={last.approved ? 'result ok' : 'result no'}>
            {last.approved ? `✓ ${last.name} 결제 완료` : `✕ ${last.name} — ${last.reason}`}
          </div>
        )}
        <div className="grid">
          {MERCHANTS.map((m) => (
            <button key={m.id} className="tile" onClick={() => setSheet(m)} disabled={busy}>
              <span className="tile-emoji">{m.emoji}</span>
              <span className="tile-name">{m.name}{m.whitelisted && <em className="pin">지정</em>}</span>
              <span className="tile-price">{m.price.toLocaleString()}원</span>
            </button>
          ))}
        </div>
        {sheet && (
          <PaySheet
            merchant={sheet}
            busy={busy}
            onCancel={() => setSheet(null)}
            onConfirm={(amount) => pay(sheet, amount)}
          />
        )}
      </div>

      {/* 부모 폰 */}
      <div className="phone parent">
        <div className="phone-head">부모 폰 — 알림·자산</div>
        <div className="asset-card">
          <div className="asset-title">아이 자산 (원본 잠김 🔒)</div>
          <div className="asset-main">
            {PRINCIPAL.toLocaleString()}원 <span className="muted small">정기예금 연 {(RATE * 100).toFixed(1)}%</span>
          </div>
          <InterestCounter principal={PRINCIPAL} rate={RATE} />
        </div>
        <div className="feed">
          {notifications.length === 0 && <div className="muted small">아직 알림이 없습니다. 왼쪽에서 결제해 보세요.</div>}
          {notifications.map((n) => (
            <div key={n.id} className={n.approved ? 'notice ok' : 'notice no'}>
              <div className="notice-head">
                <b>{n.name}</b> {n.amount.toLocaleString()}원 — {n.approved ? '승인' : '차단'}
                <span className="muted small"> {n.ts}</span>
              </div>
              {!n.approved && <div className="notice-reason">{n.reason}</div>}
              {n.approved && <div className="notice-settle">가맹점 수수료 0 정산</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
