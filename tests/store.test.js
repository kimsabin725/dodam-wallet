// 스토어 — 화면 간 상태 전이. 시연 도중 화면이 거짓말하지 않는지 본다.
import { describe, it, expect } from 'vitest';
import { initialState, reducer } from '../src/store.js';

const cond = { categories: ['분식'], whitelistOnly: true, blocked: [], monthlyLimit: 50000, perTxLimit: 10000 };
const notice = { id: 1, name: '학교앞분식', amount: 3500, approved: true, reason: '조건 충족', ts: '00:00' };

describe('reducer', () => {
  it('ISSUE는 결제 화면으로 넘기고 원장을 비운다 (재시연 시 이전 기록이 남으면 안 된다)', () => {
    const dirty = { ...initialState, ledger: [{ seq: 1 }], notifications: [notice], swept: 5000 };
    const s = reducer(dirty, { type: 'ISSUE', cond, mode: 'offline' });
    expect(s.stage).toBe('pay');
    expect(s.cond).toBe(cond);
    expect(s.ledger).toEqual([]);
    expect(s.notifications).toEqual([]);
    expect(s.swept).toBeNull();
  });

  it('PAID는 최신 알림을 앞에 쌓는다', () => {
    const s = reducer({ ...initialState, notifications: [notice] },
      { type: 'PAID', ledger: [{ seq: 2 }], notice: { ...notice, id: 2 } });
    expect(s.notifications[0].id).toBe(2);
    expect(s.notifications).toHaveLength(2);
  });

  it('스윕한 뒤 다시 결제하면 스윕 결과가 지워진다 — 미사용액이 달라졌기 때문', () => {
    const swept = reducer({ ...initialState, cond }, { type: 'SWEEP', amount: 9200 });
    expect(swept.swept).toBe(9200);
    const after = reducer(swept, { type: 'PAID', ledger: [{ seq: 1 }], notice });
    expect(after.swept).toBeNull();
  });

  it('RESET은 초기 상태로 되돌린다 (리셋 버튼 = 재시연)', () => {
    const s = reducer({ ...initialState, cond, stage: 'report', ledger: [{ seq: 1 }] }, { type: 'RESET' });
    expect(s).toEqual(initialState);
  });

  it('모르는 액션은 상태를 그대로 둔다', () => {
    const s = { ...initialState, cond };
    expect(reducer(s, { type: 'NOPE' })).toBe(s);
  });
});
