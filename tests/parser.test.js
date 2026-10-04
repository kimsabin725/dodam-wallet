import { describe, it, expect } from 'vitest';
import { parse } from '../src/core/parser.js';

describe('parser — 데모 4문장 100% 커버가 합격선', () => {
  it('1. 풀 문장: 업종·월/회당 한도·차단·지정', () => {
    const c = parse('분식이랑 문구점, 서점까지. 한 달에 5만원. 한 번에 만원까지. 게임은 안 돼. 우리 동네 지정한 가게에서만.');
    expect(c.categories).toEqual(expect.arrayContaining(['분식', '문구', '서점']));
    expect(c.monthlyLimit).toBe(50000);
    expect(c.perTxLimit).toBe(10000);
    expect(c.blocked).toContain('게임');
    expect(c.whitelistOnly).toBe(true);
  });
  it('2. 간단 문장: 업종 2개 + 월 한도', () => {
    const c = parse('분식과 문구, 월 3만원');
    expect(c.categories).toEqual(expect.arrayContaining(['분식', '문구']));
    expect(c.monthlyLimit).toBe(30000);
  });
  it('3. 부정어: 게임 금지', () => {
    const c = parse('서점만, 월 5만원, 게임 금지');
    expect(c.categories).toContain('서점');
    expect(c.blocked).toContain('게임');
    expect(c.categories).not.toContain('게임');
  });
  it('4. 카테고리 방식 + 회당 한도 숫자', () => {
    const c = parse('분식 문구 서점 편의점, 월 10만원, 한 번에 2만원');
    expect(c.categories).toEqual(expect.arrayContaining(['분식', '문구', '서점', '편의점']));
    expect(c.monthlyLimit).toBe(100000);
    expect(c.perTxLimit).toBe(20000);
    expect(c.whitelistOnly).toBe(false);
  });
});
