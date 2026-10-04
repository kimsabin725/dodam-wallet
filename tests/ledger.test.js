import { describe, it, expect } from 'vitest';
import { append, verify, tamper } from '../src/core/ledger.js';

describe('ledger — 해시 체인', () => {
  it('append는 prevHash로 연결되고 verify는 통과한다', async () => {
    let l = [];
    l = await append(l, { merchant: '학교앞분식', amount: 3500, result: '승인', reason: '조건 충족' });
    l = await append(l, { merchant: '게임아이템샵', amount: 9900, result: '차단', reason: '차단된 사용처예요' });
    expect(l).toHaveLength(2);
    expect(l[1].prevHash).toBe(l[0].hash);
    expect(await verify(l)).toBe(true);
  });
  it('변조하면 verify가 실패한다', async () => {
    let l = [];
    l = await append(l, { merchant: '우리문구', amount: 2000, result: '승인', reason: '조건 충족' });
    l = await append(l, { merchant: '알파문구', amount: 3000, result: '승인', reason: '조건 충족' });
    const bad = tamper(l, 0);
    expect(await verify(bad)).toBe(false);
  });
  it('빈 원장은 유효하다', async () => {
    expect(await verify([])).toBe(true);
  });
});
