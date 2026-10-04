// 렌더 스모크 테스트 — 빌드가 통과해도 런타임 에러는 남는다.
// react-dom/server로 실제로 그려서 크래시하는 화면이 없는지 본다 (추가 의존성 없음).
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App.jsx';
import Setup from '../src/screens/Setup.jsx';
import PayDemo from '../src/screens/PayDemo.jsx';
import Report from '../src/screens/Report.jsx';
import PaySheet from '../src/components/PaySheet.jsx';
import ProofReport from '../src/components/ProofReport.jsx';
import { parse } from '../src/core/parser.js';
import { append } from '../src/core/ledger.js';
import { MERCHANTS } from '../src/data/merchants.js';
import { judge } from '../src/core/judge.js';

const cond = parse('분식이랑 문구점, 서점까지. 한 달에 5만원. 한 번에 만원까지. 게임은 안 돼. 우리 동네 지정한 가게에서만.');
const noop = () => {};

// 실제 시연처럼 12칸을 눌러 원장을 만든다
async function buildLedger() {
  let ledger = [];
  for (const m of MERCHANTS) {
    const r = judge(m, m.price, cond, ledger);
    ledger = await append(ledger, {
      merchant: m.name, amount: m.price,
      result: r.approved ? '승인' : '차단', reason: r.reason
    });
  }
  return ledger;
}

describe('렌더 스모크 — 화면이 실제로 그려지는가', () => {
  it('App이 크래시 없이 그려진다 (localStorage 없는 환경 포함)', () => {
    const html = renderToString(React.createElement(App));
    expect(html).toContain('도담월렛');
  });

  it('Setup이 그려진다', () => {
    const html = renderToString(React.createElement(Setup, { dispatch: noop }));
    expect(html).toContain('말로 조건을 정하세요');
  });

  it('PayDemo가 조건과 빈 원장으로 그려진다', () => {
    const state = { cond, ledger: [], notifications: [] };
    const html = renderToString(React.createElement(PayDemo, { state, dispatch: noop }));
    expect(html).toContain('학교앞분식');
    expect(html).toContain('아이 자산');
  });

  it('PayDemo가 거래가 쌓인 뒤에도 그려진다', async () => {
    const ledger = await buildLedger();
    const notifications = ledger.map((b) => ({
      id: b.seq, name: b.merchant, amount: b.amount,
      approved: b.result === '승인', reason: b.reason, ts: '00:00:00'
    })).reverse();
    const html = renderToString(React.createElement(PayDemo, { state: { cond, ledger, notifications }, dispatch: noop }));
    expect(html).toContain('수수료 0 정산');
  });

  it('결제 시트가 그려진다', () => {
    const html = renderToString(React.createElement(PaySheet, {
      merchant: MERCHANTS[0], onConfirm: noop, onCancel: noop, busy: false
    }));
    expect(html).toContain('결제하기');
  });

  it('Report가 빈 원장에서도 그려진다 (거래 전에 리포트를 눌러도 안 죽는다)', () => {
    const html = renderToString(React.createElement(Report, {
      state: { ledger: [], cond, swept: null }, dispatch: noop
    }));
    expect(html).toContain('해시 체인');
  });

  it('Report가 12건 원장으로 그려진다', async () => {
    const ledger = await buildLedger();
    const html = renderToString(React.createElement(Report, {
      state: { ledger, cond, swept: null }, dispatch: noop
    }));
    expect(html).toContain('동성로책방');
  });

  it('증빙 리포트 모달이 그려진다', async () => {
    const ledger = await buildLedger();
    const html = renderToString(React.createElement(ProofReport, { ledger, cond, onClose: noop }));
    expect(html).toContain('증여 실질 입증');
    expect(html).toContain('업종별 사용 분포');
  });

  it('증빙 리포트가 승인 0건일 때도 안 죽는다 (0으로 나누기)', () => {
    const html = renderToString(React.createElement(ProofReport, { ledger: [], cond, onClose: noop }));
    expect(html).toContain('승인된 지출이 없습니다');
  });
});
