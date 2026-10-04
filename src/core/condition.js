// 조건 스키마와 정규화. 모든 금액은 원 단위 정수.
export const DEFAULT_CONDITION = {
  categories: [],       // 허용 업종
  whitelistOnly: false, // true면 지정 가맹점에서만
  blocked: [],          // 차단 업종 (허용보다 우선)
  monthlyLimit: 50000,
  perTxLimit: 10000
};

// 판정 엔진이 이해하는 업종은 이 목록이 전부다.
// 목록 밖 업종이 조건에 들어오면 그 조건은 영원히 매칭되지 않으므로(=조용한 오작동)
// 검증 단계에서 걸러낸다.
export const CATEGORIES = ['분식', '문구', '서점', '편의점', '제과', '오락', '생활용품', '게임', '온라인'];

export function normalize(raw) {
  const c = { ...DEFAULT_CONDITION, ...raw };
  c.categories = [...new Set(c.categories)];
  c.blocked = [...new Set(c.blocked)];
  c.monthlyLimit = Math.max(0, c.monthlyLimit | 0);
  c.perTxLimit = Math.max(0, c.perTxLimit | 0);
  return c;
}

// 조건이 실제로 동작할 수 있는 물건인지 검사한다.
// AI 응답이든 룰 파서 결과든 같은 문을 통과시킨다 — 어느 쪽도 신뢰하지 않는다.
export function validate(c) {
  const errors = [];
  if (!c || typeof c !== 'object') return { ok: false, errors: ['조건이 객체가 아닙니다'] };
  if (!Array.isArray(c.categories) || !Array.isArray(c.blocked)) {
    return { ok: false, errors: ['categories/blocked가 배열이 아닙니다'] };
  }
  const unknown = [...c.categories, ...c.blocked].filter((x) => !CATEGORIES.includes(x));
  if (unknown.length) errors.push(`알 수 없는 업종: ${unknown.join(', ')}`);
  if (c.categories.length === 0) errors.push('허용 업종이 하나도 없습니다');
  if (c.categories.some((x) => c.blocked.includes(x))) errors.push('허용과 차단에 같은 업종이 있습니다');
  if (!(c.monthlyLimit > 0)) errors.push('월 한도가 0입니다');
  if (!(c.perTxLimit > 0)) errors.push('회당 한도가 0입니다');
  if (c.perTxLimit > c.monthlyLimit) errors.push('회당 한도가 월 한도보다 큽니다');
  return { ok: errors.length === 0, errors };
}

export function describe(c) {
  const parts = [];
  if (c.categories.length) parts.push(c.categories.join('·'));
  if (c.whitelistOnly) parts.push('지정 가맹점만');
  parts.push(`월 ${c.monthlyLimit.toLocaleString()}원`);
  parts.push(`회당 ${c.perTxLimit.toLocaleString()}원`);
  if (c.blocked.length) parts.push(`${c.blocked.join('·')} 차단`);
  return parts.join(' / ');
}
