// 자연어 → 조건 변환.
//
// 기본 경로는 룰 파서(오프라인)다. 심사장 네트워크가 죽어도 전 기능이 그대로 동작한다.
// 설정(⚙)에서 API 키를 넣으면 Claude가 변환하고, 어느 단계에서든 실패하면 룰 파서로 되돌아간다.
// 키는 localStorage에만 있고 코드·저장소에 절대 넣지 않는다(제출 코드에 시크릿 0건).
import { parse } from './core/parser.js';
import { normalize, validate, CATEGORIES } from './core/condition.js';

const SYSTEM = `너는 자녀 용돈 조건 파서다. 부모의 한국어 문장을 아래 JSON으로만 변환해라. 설명 금지.
{"categories":[...],"whitelistOnly":true|false,"blocked":[...],"monthlyLimit":정수원,"perTxLimit":정수원}
- categories/blocked의 업종은 반드시 다음 중에서만 고른다: ${CATEGORIES.join(', ')}
- 같은 업종을 categories와 blocked에 동시에 넣지 않는다
- 금액은 "원" 단위 정수로 쓴다 (5만원 → 50000)
- "우리 동네", "지정한 곳" 같은 표현이 있으면 whitelistOnly를 true로 한다`;

// 응답에서 text 블록만 골라낸다.
// content[0]을 그냥 집으면 안 된다 — thinking 블록이 앞에 올 수 있고, 그 경우 text가 비어 있다.
function extractText(data) {
  const blocks = Array.isArray(data?.content) ? data.content : [];
  return blocks
    .filter((b) => b?.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('');
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('JSON을 찾지 못했습니다');
  return JSON.parse(text.slice(start, end + 1));
}

export async function toCondition(text) {
  const fallback = () => ({ cond: parse(text), mode: 'offline' });

  let key = null;
  try { key = localStorage.getItem('anthropic_key'); } catch { /* 저장소 접근 불가 */ }
  if (!key) return fallback();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        // 백엔드 없는 구조라 브라우저에서 직접 호출한다. 이 헤더가 그 공식 경로다.
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-5',
        // thinking 토큰도 max_tokens를 함께 쓴다 — JSON이 잘리지 않도록 여유를 둔다
        max_tokens: 4096,
        // 한 문장 파싱이라 낮은 effort로 충분하다 — 시연 중 대기 시간을 줄인다
        output_config: { effort: 'low' },
        system: SYSTEM,
        messages: [{ role: 'user', content: text }]
      })
    });

    if (!res.ok) return { ...fallback(), mode: 'fallback' };

    const data = await res.json();
    // 안전 분류기가 거절하면 200이지만 stop_reason이 refusal이다
    if (data?.stop_reason === 'refusal') return { ...fallback(), mode: 'fallback' };

    const cond = normalize(extractJson(extractText(data)));

    // AI가 준 조건이라도 검증을 통과해야 쓴다.
    // 목록 밖 업종이 섞이면 그 조건은 영원히 매칭되지 않아 판정이 조용히 틀린다.
    const { ok } = validate(cond);
    if (!ok) return { ...fallback(), mode: 'fallback' };

    return { cond, mode: 'claude' };
  } catch {
    // 네트워크·파싱·JSON 오류 — 무엇이든 룰 파서로 되돌아간다
    return { ...fallback(), mode: 'fallback' };
  }
}
