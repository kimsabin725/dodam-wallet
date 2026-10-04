// 해시 체인 원장 — append-only. SHA-256.
//
// Web Crypto가 있으면 그것을 쓰고, 없으면 순수 구현으로 넘어간다.
// 파일을 더블클릭해 여는 배포본(file://)처럼 crypto.subtle이 없을 수 있는 환경에서도
// 원장과 검증이 그대로 동작해야 하기 때문이다. 두 경로의 결과는 동일하다(tests/sha256.test.js).
import { sha256Sync } from './sha256.js';

async function sha256(str) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Sync(str);
}

export async function append(ledger, entry) {
  const prevHash = ledger.length ? ledger[ledger.length - 1].hash : 'GENESIS';
  const base = {
    seq: ledger.length + 1,
    ts: entry.ts ?? Date.now(),
    merchant: entry.merchant,
    amount: entry.amount,
    result: entry.result,
    reason: entry.reason,
    prevHash
  };
  const hash = await sha256(JSON.stringify(base));
  return [...ledger, { ...base, hash }];
}

export async function verify(ledger) {
  let prev = 'GENESIS';
  for (const block of ledger) {
    const { hash, ...rest } = block;
    if (rest.prevHash !== prev) return false;
    if ((await sha256(JSON.stringify(rest))) !== hash) return false;
    prev = hash;
  }
  return true;
}

// 변조 시연용: i번째 블록 금액을 조작한 사본을 돌려준다 (해시는 그대로 → verify 실패)
export function tamper(ledger, i = 0) {
  if (!ledger[i]) return ledger;
  const copy = ledger.map((b) => ({ ...b }));
  copy[i].amount += 10000;
  return copy;
}
