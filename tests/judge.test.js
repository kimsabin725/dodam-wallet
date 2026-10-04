import { describe, it, expect } from 'vitest';
import { judge } from '../src/core/judge.js';
import { normalize } from '../src/core/condition.js';

const cond = normalize({
  categories: ['분식', '문구', '서점'],
  whitelistOnly: true,
  blocked: ['게임', '온라인'],
  monthlyLimit: 50000,
  perTxLimit: 10000
});
const M = (name, category, whitelisted) => ({ name, category, whitelisted });
const APPROVED = (amount) => ({ merchant: 'x', amount, result: '승인', reason: '' });

describe('judge — 판정 엔진', () => {
  it('1. 조건 내 결제는 승인된다 (분식·지정·한도 내)', () => {
    const r = judge(M('학교앞분식', '분식', true), 3500, cond, []);
    expect(r.approved).toBe(true);
  });
  it('2. 차단 업종(게임)은 지정 여부와 무관하게 차단', () => {
    const r = judge(M('게임아이템샵', '게임', true), 1000, cond, []);
    expect(r).toEqual({ approved: false, reason: '차단된 사용처예요' });
  });
  it('3. 허용 목록에 없는 업종(편의점)은 차단', () => {
    const r = judge(M('편의점', '편의점', false), 1500, cond, []);
    expect(r.reason).toBe('조건에 없는 업종이에요');
  });
  it('4. 허용 업종이라도 미지정 가맹점(달콤분식)은 차단', () => {
    const r = judge(M('달콤분식', '분식', false), 4000, cond, []);
    expect(r.reason).toBe('지정 가맹점이 아니에요');
  });
  it('5. 회당 한도 초과(12,000 > 10,000)는 차단', () => {
    const r = judge(M('떡볶이월드', '분식', true), 12000, cond, []);
    expect(r.approved).toBe(false);
    expect(r.reason).toContain('1회 한도');
  });
  it('6. 월 누적 + 이번 결제가 월 한도를 넘으면 차단', () => {
    const r = judge(M('학교앞분식', '분식', true), 3500, cond, [APPROVED(48000)]);
    expect(r.reason).toBe('이번 달 한도를 넘었어요');
  });
  it('7. 경계값: 회당 한도와 정확히 같으면 승인', () => {
    const r = judge(M('학교앞분식', '분식', true), 10000, cond, []);
    expect(r.approved).toBe(true);
  });
  it('8. 경계값: 월 한도를 정확히 채우면 승인', () => {
    const r = judge(M('학교앞분식', '분식', true), 2000, cond, [APPROVED(48000)]);
    expect(r.approved).toBe(true);
  });
});
