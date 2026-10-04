import React, { useState } from 'react';

// 결제 시트 — 타일을 탭하면 아이 폰 아래에서 올라온다.
// 금액을 고칠 수 있게 둔 이유: 심사위원이 아무 가게에서나 회당 한도를 직접 넘겨볼 수 있다.
export default function PaySheet({ merchant, onConfirm, onCancel, busy }) {
  const [amount, setAmount] = useState(merchant.price);

  return (
    <div className="sheet-back" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-merchant">
          <span className="sheet-emoji">{merchant.emoji}</span>
          <div>
            <div className="sheet-name">
              {merchant.name}
              {merchant.whitelisted
                ? <em className="pin">지정 가맹점</em>
                : <em className="pin off">미지정</em>}
            </div>
            <div className="muted small">{merchant.category}</div>
          </div>
        </div>

        <label className="field">
          <div className="field-label">결제 금액</div>
          <input
            className="input num big-num"
            type="number" min="0" step="500"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>

        <button className="primary big" disabled={busy || !(amount > 0)} onClick={() => onConfirm(amount)}>
          {busy ? '조건 확인 중…' : `${amount.toLocaleString()}원 결제하기`}
        </button>
        <button className="sheet-cancel" onClick={onCancel}>취소</button>
      </div>
    </div>
  );
}
