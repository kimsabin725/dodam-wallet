// 룰 기반 자연어 → 조건 파서. "AI 오프라인 모드"의 실체.
// 합격선: 시연 대본의 데모 4문장 100% 커버 (tests/parser.test.js)
import { normalize } from './condition.js';

const CAT = {
  '분식': '분식', '떡볶이': '분식', '김밥': '분식',
  '문구': '문구', '문방구': '문구',
  '서점': '서점', '책': '서점',
  '편의점': '편의점',
  '빵': '제과', '제과': '제과',
  '게임': '게임', '아이템': '게임',
  '온라인': '온라인'
};

export function parse(text) {
  const cond = { categories: [], whitelistOnly: false, blocked: [], monthlyLimit: 50000, perTxLimit: 10000 };
  for (const [kw, cat] of Object.entries(CAT)) {
    if (!text.includes(kw)) continue;
    const idx = text.indexOf(kw);
    const windowAfter = text.slice(idx, idx + 12);
    if (/안\s*돼|금지|말고|빼/.test(windowAfter)) {
      if (!cond.blocked.includes(cat)) cond.blocked.push(cat);
    } else if (!cond.categories.includes(cat)) {
      cond.categories.push(cat);
    }
  }
  const monthly = text.match(/(?:월|한\s*달에?)\s*(\d+)\s*만\s*원?/);
  if (monthly) cond.monthlyLimit = Number(monthly[1]) * 10000;
  const perTx = text.match(/(?:한\s*번에|회당)\s*(\d+)?\s*만\s*원?/);
  if (perTx) cond.perTxLimit = (perTx[1] ? Number(perTx[1]) : 1) * 10000;
  if (/우리\s*동네|지정/.test(text)) cond.whitelistOnly = true;
  // 차단으로 분류된 업종은 허용 목록에서 제거
  cond.categories = cond.categories.filter((c) => !cond.blocked.includes(c));
  return normalize(cond);
}
