// 시연 대본을 실행 가능한 명세로 고정한다.
// 가맹점 데이터나 판정 순서가 바뀌어 대본이 어긋나면 여기서 깨진다.
import { describe, it, expect } from 'vitest';
import { MERCHANTS } from '../src/data/merchants.js';
import { judge, monthSpent } from '../src/core/judge.js';
import { parse } from '../src/core/parser.js';

const SETUP = '분식이랑 문구점, 서점까지. 한 달에 5만원. 한 번에 만원까지. 게임은 안 돼. 우리 동네 지정한 가게에서만.';

// 위에서부터 차례로 누르며 승인건만 원장에 쌓는다 = 심사장에서 하는 그대로
function walk(cond) {
  const ledger = [];
  return MERCHANTS.map((m) => {
    const r = judge(m, m.price, cond, ledger);
    if (r.approved) ledger.push({ result: '승인', amount: m.price });
    return { name: m.name, approved: r.approved, reason: r.reason, spent: monthSpent(ledger) };
  });
}

describe('시연 대본 — 기본 조건에서 타일을 위에서부터 누른다', () => {
  const cond = parse(SETUP);
  const run = walk(cond);

  it('설정 문장이 대본의 조건 그대로 파싱된다', () => {
    expect(cond).toEqual({
      categories: ['분식', '문구', '서점'],
      whitelistOnly: true,
      blocked: ['게임'],
      monthlyLimit: 50000,
      perTxLimit: 10000
    });
  });

  it('12타일이 승인·차단 번갈아 나온다 (나란히 대비되는 화면)', () => {
    expect(run.map((r) => r.approved)).toEqual([
      true, false, true, false, true, false, true, false, true, false, true, false
    ]);
  });

  it('차단 사유 5종이 전부 나온다 (지정 가맹점 사유만 두 번 — 의도된 중복)', () => {
    const reasons = run.filter((r) => !r.approved).map((r) => r.reason);
    expect(reasons).toEqual([
      '차단된 사용처예요',
      '지정 가맹점이 아니에요',      // 달콤분식 — 같은 분식인데 지정 안 된 곳
      '지정 가맹점이 아니에요',      // 다이소  — 골목 아닌 대형매장
      '조건에 없는 업종이에요',
      '1회 한도(10,000원)를 넘었어요',
      '이번 달 한도를 넘었어요'
    ]);
    expect(new Set(reasons).size).toBe(5);
  });

  it('킬러 컷: 학교앞분식 승인 바로 다음 타일이 게임 차단', () => {
    expect(run[0]).toMatchObject({ name: '학교앞분식', approved: true });
    expect(run[1]).toMatchObject({ name: '게임아이템샵', reason: '차단된 사용처예요' });
  });

  it('마지막 타일에서 월 한도가 걸린다 — 누적 40,800원 + 9,800원 > 50,000원', () => {
    const last = run[run.length - 1];
    expect(last).toMatchObject({ name: '동성로책방', reason: '이번 달 한도를 넘었어요' });
    expect(last.spent).toBe(40800);
  });

  it('리포트 스윕 카드에 표시될 미사용액은 9,200원', () => {
    expect(cond.monthlyLimit - run[run.length - 1].spent).toBe(9200);
  });
});

describe('자율성 이양 — 중등 템플릿(지정 해제)이면 막혔던 곳이 열린다', () => {
  it('달콤분식·다이소가 지정 해제만으로 승인으로 바뀐다', async () => {
    const { TEMPLATES } = await import('../src/data/templates.js');
    const middle = TEMPLATES.find((t) => t.id === 't3');
    const run = walk(middle.cond);
    expect(run.find((r) => r.name === '달콤분식').approved).toBe(true);
    expect(run.find((r) => r.name === '다이소').approved).toBe(true);
    expect(run.find((r) => r.name === '게임아이템샵').approved).toBe(false); // 게임은 여전히 막힌다
  });
});
