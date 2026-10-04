// 단일 스토어 — useReducer. 화면 간 공유 상태.
// localStorage에 저장한다: 심사장에서 새로고침이 나도 시연이 처음으로 돌아가지 않는다.
const KEY = 'dodam_state_v1';

export const initialState = {
  stage: 'setup',        // setup | pay | report
  cond: null,            // 발행된 조건
  ledger: [],            // 해시 체인 원장
  notifications: [],     // 부모 폰 알림 피드 (최신이 앞)
  aiMode: null,          // offline | claude | fallback | template
  swept: null            // 월말 스윕으로 씨앗적금에 옮긴 금액
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;               // 손상된 저장분은 조용히 버린다
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 사파리 프라이빗 등 저장 불가 환경 — 저장만 못 할 뿐 시연은 그대로 */
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'ISSUE':
      return { ...state, cond: action.cond, aiMode: action.mode, stage: 'pay', ledger: [], notifications: [], swept: null };
    case 'PAID':
      // 스윕 이후에 다시 결제하면 미사용액이 달라진다 — 옛 스윕 결과를 남겨두면 화면이 거짓말을 한다
      return { ...state, ledger: action.ledger, notifications: [action.notice, ...state.notifications], swept: null };
    case 'SWEEP':
      return { ...state, swept: action.amount };
    case 'STAGE':
      return { ...state, stage: action.stage };
    case 'RESET':
      try { localStorage.removeItem(KEY); } catch { /* 무시 */ }
      return { ...initialState };
    default:
      return state;
  }
}
