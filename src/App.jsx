import React, { useReducer, useEffect, useState } from 'react';
import { initialState, reducer, loadState, saveState } from './store.js';
import Setup from './screens/Setup.jsx';
import PayDemo from './screens/PayDemo.jsx';
import Report from './screens/Report.jsx';
import SettingsModal from './components/SettingsModal.jsx';

const STAGES = [
  { id: 'setup', label: '① 조건 설정' },
  { id: 'pay', label: '② 결제' },
  { id: 'report', label: '③ 리포트' }
];

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState, loadState);
  const [settings, setSettings] = useState(false);

  // 새로고침이 나도 시연이 처음으로 돌아가지 않도록 저장한다
  useEffect(() => { saveState(state); }, [state]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">도담월렛 <span className="brand-sub">— 조건을 심은 용돈 · iM뱅크 2026 AI Blockchain 데모</span></div>
        <nav className="stages">
          {STAGES.map((s) => (
            <button
              key={s.id}
              className={state.stage === s.id ? 'stage on' : 'stage'}
              disabled={s.id !== 'setup' && !state.cond}
              onClick={() => dispatch({ type: 'STAGE', stage: s.id })}
            >
              {s.label}
            </button>
          ))}
          <button className="stage" onClick={() => setSettings(true)} title="AI 모드 설정">⚙</button>
          <button className="stage reset" onClick={() => dispatch({ type: 'RESET' })}>리셋</button>
        </nav>
      </header>
      <main>
        {state.stage === 'setup' && <Setup dispatch={dispatch} />}
        {state.stage === 'pay' && <PayDemo state={state} dispatch={dispatch} />}
        {state.stage === 'report' && <Report state={state} dispatch={dispatch} />}
      </main>
      {settings && <SettingsModal onClose={() => setSettings(false)} />}
    </div>
  );
}
