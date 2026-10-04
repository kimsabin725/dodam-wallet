import React, { useEffect, useState } from 'react';

// 원본에서 발생하는 이자를 초 단위로 올려 보여준다.
// v1.2 반증 교정: 이자 시연은 용돈 잔액이 아니라 '증여 원본'에서만 한다(수치가 성립하는 곳).
export default function InterestCounter({ principal, rate }) {
  const daily = (principal * rate) / 365;
  const [elapsed, setElapsed] = useState(0);   // 화면을 켜 둔 시간(초)

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 오늘 발생한 이자 + 보고 있는 동안 쌓인 몫
  const today = daily + (daily / 86400) * elapsed;
  return (
    <div className="asset-int">
      오늘 발생 이자 <b>+{today.toLocaleString(undefined, { maximumFractionDigits: 2 })}원</b>
      <span className="asset-int-sub"> — 쓰이기 전까지는 예금입니다</span>
    </div>
  );
}
