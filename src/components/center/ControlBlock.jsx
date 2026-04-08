import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useLang } from '../../context/LangContext';

export default function ControlBlock({ app, onToggle, onReset, onSensChange, sOn }) {
  const { t } = useLang();
  const [sensVal, setSensVal] = useState(3);

  const isRunning = app === 'running';
  const goText = app === 'paused' ? t('btnResume') : t('btnStart');
  const dangerText = isRunning ? t('btnStop') : t('reset');
  const dangerAction = isRunning ? onToggle : onReset;

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
      <div className="ctrl-btns">
        <button
          className={`ctrl-btn go${isRunning ? ' hidden' : ''}`}
          onClick={onToggle}
        >{goText}</button>
        <button
          className={`ctrl-btn ${isRunning ? 'stop' : 'reset'}`}
          onClick={dangerAction}
          disabled={app === 'idle'}
        >{isRunning ? dangerText : <><RotateCcw size={13} strokeWidth={2.5} /> {dangerText}</>}</button>
      </div>
    </div>
  );
}
