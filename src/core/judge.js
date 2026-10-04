// 판정 엔진 — 순수 함수. 사유 문자열이 그대로 알림 문구가 된다.
// 판정 순서: 차단 업종 → 허용 업종 → 지정 가맹점 → 회당 한도 → 월 한도
export function monthSpent(ledger) {
  return ledger
    .filter((e) => e.result === '승인')
    .reduce((s, e) => s + e.amount, 0);
}

export function judge(merchant, amount, cond, ledger) {
  const no = (reason) => ({ approved: false, reason });
  if (cond.blocked.includes(merchant.category)) return no('차단된 사용처예요');
  if (!cond.categories.includes(merchant.category)) return no('조건에 없는 업종이에요');
  if (cond.whitelistOnly && !merchant.whitelisted) return no('지정 가맹점이 아니에요');
  if (amount > cond.perTxLimit)
    return no(`1회 한도(${cond.perTxLimit.toLocaleString()}원)를 넘었어요`);
  if (monthSpent(ledger) + amount > cond.monthlyLimit)
    return no('이번 달 한도를 넘었어요');
  return { approved: true, reason: '조건 충족' };
}
