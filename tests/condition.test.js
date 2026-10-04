// 조건 검증 — AI 응답이든 룰 파서 결과든 같은 문을 통과해야 한다.
import { describe, it, expect } from 'vitest';
import { normalize, validate, CATEGORIES } from '../src/core/condition.js';
import { parse } from '../src/core/parser.js';

const base = {
  categories: ['분식', '문구'], whitelistOnly: true, blocked: ['게임'],
  monthlyLimit: 50000, perTxLimit: 10000
};

describe('validate — 조건이 실제로 동작할 물건인지', () => {
  it('정상 조건은 통과한다', () => {
    expect(validate(normalize(base)).ok).toBe(true);
  });

  it('목록 밖 업종은 걸러낸다 (판정이 조용히 틀리는 것을 막는다)', () => {
    const r = validate(normalize({ ...base, categories: ['분식', '주점'] }));
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toContain('주점');
  });

  it('허용 업종이 하나도 없으면 거부한다 — 아무 데서도 못 쓰는 카드가 된다', () => {
    expect(validate(normalize({ ...base, categories: [] })).ok).toBe(false);
  });

  it('같은 업종이 허용과 차단에 동시에 있으면 거부한다', () => {
    const r = validate(normalize({ ...base, blocked: ['분식'] }));
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toContain('허용과 차단');
  });

  it('회당 한도가 월 한도보다 크면 거부한다', () => {
    const r = validate(normalize({ ...base, perTxLimit: 60000 }));
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toContain('월 한도보다');
  });

  it('한도가 0이면 거부한다', () => {
    expect(validate(normalize({ ...base, monthlyLimit: 0 })).ok).toBe(false);
    expect(validate(normalize({ ...base, perTxLimit: 0 })).ok).toBe(false);
  });

  it('객체가 아닌 입력에도 죽지 않는다', () => {
    expect(validate(null).ok).toBe(false);
    expect(validate({ categories: '분식' }).ok).toBe(false);
  });

  it('룰 파서의 출력은 항상 검증을 통과한다', () => {
    const sentences = [
      '분식이랑 문구점, 서점까지. 한 달에 5만원. 한 번에 만원까지. 게임은 안 돼. 우리 동네 지정한 가게에서만.',
      '문구점만 월 3만원',
      '분식이랑 서점. 게임은 금지.',
      '떡볶이랑 책. 한 달에 2만원.'
    ];
    for (const s of sentences) expect(validate(parse(s)).ok).toBe(true);
  });

  it('파서가 쓰는 업종은 전부 CATEGORIES 안에 있다', () => {
    const c = parse('분식 문구 서점 편의점 빵 게임 온라인');
    for (const cat of [...c.categories, ...c.blocked]) expect(CATEGORIES).toContain(cat);
  });
});
