// AI 디폴트 템플릿 — 연령별 조건 기본값 (퇴직연금 디폴트옵션 원리의 적용)
// 성장할수록 조건이 풀린다: 지정가맹 → 카테고리 → 한도만
export const TEMPLATES = [
  {
    id: 't1', label: '초등 저학년 기본형',
    hint: '지정 가맹점에서만',
    cond: { categories: ['분식', '문구'], whitelistOnly: true, blocked: ['게임', '온라인'], monthlyLimit: 30000, perTxLimit: 5000 }
  },
  {
    id: 't2', label: '초등 고학년 기본형',
    hint: '지정 가맹점 + 서점 추가',
    cond: { categories: ['분식', '문구', '서점'], whitelistOnly: true, blocked: ['게임', '온라인'], monthlyLimit: 50000, perTxLimit: 10000 }
  },
  {
    id: 't3', label: '중등 기본형',
    hint: '카테고리 방식 (지정 해제)',
    cond: { categories: ['분식', '문구', '서점', '편의점', '제과'], whitelistOnly: false, blocked: ['게임', '온라인'], monthlyLimit: 100000, perTxLimit: 20000 }
  },
  {
    id: 't4', label: '고등 기본형',
    hint: '한도만 관리',
    cond: { categories: ['분식', '문구', '서점', '편의점', '제과', '오락', '생활용품'], whitelistOnly: false, blocked: ['온라인'], monthlyLimit: 200000, perTxLimit: 50000 }
  }
];
