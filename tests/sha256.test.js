// 순수 SHA-256이 Web Crypto와 정확히 같은 결과를 내는지 검증한다.
// 이게 어긋나면 배포본과 개발본의 원장 해시가 달라진다 — 증빙이 무너진다.
import { describe, it, expect } from 'vitest';
import { sha256Sync } from '../src/core/sha256.js';

async function webCrypto(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

describe('sha256Sync — Web Crypto 대체 경로', () => {
  it('공개 표준 벡터와 일치한다', () => {
    expect(sha256Sync('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Sync('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Sync('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'))
      .toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });

  it('한글·이모지·긴 문자열에서 Web Crypto와 일치한다', async () => {
    const cases = [
      '',
      'a',
      '학교앞분식',
      '{"seq":1,"merchant":"학교앞분식","amount":3500,"result":"승인"}',
      '🍢✏️📚 도담월렛',
      '가'.repeat(1000),
      JSON.stringify({ seq: 12, ts: 1787000000000, merchant: '동성로책방', amount: 9800, prevHash: 'GENESIS' })
    ];
    for (const c of cases) expect(sha256Sync(c)).toBe(await webCrypto(c));
  });

  it('블록 경계(55·56·63·64·65바이트)에서도 일치한다 — 패딩이 틀리기 쉬운 지점', async () => {
    for (const n of [54, 55, 56, 57, 63, 64, 65, 119, 120, 127, 128]) {
      const s = 'x'.repeat(n);
      expect(sha256Sync(s), `길이 ${n}`).toBe(await webCrypto(s));
    }
  });

  it('한 글자만 달라도 완전히 다른 해시가 나온다 (변조 감지의 근거)', () => {
    const a = sha256Sync('{"amount":3500}');
    const b = sha256Sync('{"amount":3501}');
    expect(a).not.toBe(b);
    const diff = [...a].filter((ch, i) => ch !== b[i]).length;
    expect(diff).toBeGreaterThan(40);   // 64자 중 대부분이 바뀐다
  });
});
