import { useState } from 'react';
import { useLang } from '../../context/LangContext';

export default function ControlBlock({ app, onToggle, onReset, onSensChange, sOn }) {
  const { t } = useLang();
  const [sensVal, setSensVal] = useState(3);

  const btnText = app === 'running' ? t('btnStop') : app === 'paused' ? t('btnResume') : t('btnStart');
  const btnClass = 'main-btn' + (app === 'running' ? ' running' : '');

  function handleSens(e) {
    const v = parseFloat(e.target.value);
    setSensVal(v);
    onSensChange(v);
  }

  return (
    <div className="ctrl-block">
      <div className={'sr-row' + (sOn ? ' show' : '')}>
        <span>{t('sens')}</span>
        <input type="range" min="1" max="10" step=".5" value={sensVal} onChange={handleSens} />
        <span className="sr-val">{sensVal}</span>
      </div>
      <button className={btnClass} onClick={onToggle}>{btnText}</button>
      <button className="rst-btn" onClick={onReset} disabled={app === 'running'}>{t('reset')}</button>
    </div>
  );
}
