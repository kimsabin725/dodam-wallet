// 데모 가맹점 12곳 — 대구 학교 앞 상권 톤. price는 결제 시트 기본값.
//
// 배치 원칙 (시연 대본과 1:1로 맞춘다):
//  - 기본 조건(분식·문구·서점 / 지정만 / 회당 1만 / 월 5만) 기준으로
//    위에서부터 차례로 누르면 판정 6종이 전부 나온다.
//    '지정 가맹점이 아니에요'만 두 번인데 의도적이다 — 달콤분식(같은 업종인데 미지정)과
//    다이소(미지정 대형매장)는 같은 사유로 서로 다른 이야기를 한다.
//  - 홀수 = 승인, 짝수 = 차단으로 번갈아 두어 타일이 나란히 대비되게 한다.
//  - 승인 7곳 합계 50,600원 → 마지막 동성로책방에서 월 한도가 걸린다(=월 한도 시연).
//  - 다이소는 업종이 아니라 '지정 안 된 대형매장'으로 걸려야 한다.
//    제안요약서의 "용돈이 다이소가 아니라 골목으로 흐르게" 서사가 여기서 성립한다.
export const MERCHANTS = [
  { id: 'm1',  name: '학교앞분식',   category: '분식', whitelisted: true,  price: 3500,  emoji: '🍢' }, // 승인
  { id: 'm2',  name: '게임아이템샵', category: '게임', whitelisted: false, price: 9900,  emoji: '🎮' }, // 차단 업종
  { id: 'm3',  name: '우리문구',     category: '문구', whitelisted: true,  price: 2500,  emoji: '✏️' }, // 승인
  { id: 'm4',  name: '달콤분식',     category: '분식', whitelisted: false, price: 4000,  emoji: '🧁' }, // 미지정(같은 분식인데)
  { id: 'm5',  name: '푸른동네서점', category: '서점', whitelisted: true,  price: 9800,  emoji: '📚' }, // 승인
  { id: 'm6',  name: '다이소',       category: '문구', whitelisted: false, price: 5000,  emoji: '🧺' }, // 미지정(대형매장)
  { id: 'm7',  name: '신천김밥',     category: '분식', whitelisted: true,  price: 7000,  emoji: '🍙' }, // 승인
  { id: 'm8',  name: '코인노래방',   category: '오락', whitelisted: false, price: 4000,  emoji: '🎤' }, // 조건에 없는 업종
  { id: 'm9',  name: '반월당떡볶이', category: '분식', whitelisted: true,  price: 9000,  emoji: '🌶️' }, // 승인
  { id: 'm10', name: '떡볶이월드',   category: '분식', whitelisted: true,  price: 12000, emoji: '🔥' }, // 회당 한도 초과
  { id: 'm11', name: '칠성문구',     category: '문구', whitelisted: true,  price: 9000,  emoji: '✒️' }, // 승인
  { id: 'm12', name: '동성로책방',   category: '서점', whitelisted: true,  price: 9800,  emoji: '📖' }  // 여기서 월 한도가 걸린다
];
