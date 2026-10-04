import React, { useState } from 'react';
import Modal from './Modal.jsx';

// Claude API 키 입력. 키는 localStorage에만 두고 저장소·코드에는 절대 넣지 않는다.
// 키가 없으면 룰 파서('AI 오프라인 모드')로 동작하므로 데모는 키 없이도 전 기능이 돈다.
export default function SettingsModal({ onClose }) {
  const [key, setKey] = useState(() => {
    try { return localStorage.getItem('anthropic_key') || ''; } catch { return ''; }
  });
  const [saved, setSaved] = useState(false);

  function save() {
    try {
      if (key.trim()) localStorage.setItem('anthropic_key', key.trim());
      else localStorage.removeItem('anthropic_key');
      setSaved(true);
      setTimeout(onClose, 700);
    } catch { setSaved(true); }
  }

  return (
    <Modal title="AI 모드 설정" onClose={onClose}>
      <p className="muted small">
        키를 넣지 않으면 <b>AI 오프라인 모드</b>(룰 파서)로 동작합니다. 심사장 네트워크와 무관하게
        전 기능이 그대로 돌아갑니다. 키를 넣으면 자연어 변환만 Claude가 처리하고, 실패하면 자동으로 룰 파서로 되돌아갑니다.
      </p>
      <input
        className="input"
        type="password"
        placeholder="sk-ant-..."
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <p className="muted small">
        이 키는 이 브라우저의 localStorage에만 저장되며 제출 코드에는 포함되지 않습니다.
      </p>
      <div className="row">
        <button className="primary" onClick={save}>저장</button>
        <button onClick={() => { setKey(''); }}>키 지우기</button>
        {saved && <span className="chip ok">저장됨</span>}
      </div>
    </Modal>
  );
}
