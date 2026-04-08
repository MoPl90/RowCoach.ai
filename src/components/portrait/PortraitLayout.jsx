import { RotateCcw } from 'lucide-react';
import { useLang } from '../../context/LangContext';

export default function PortraitLayout({ sRate, split, elapsed, tDist, avgRate, avgSplit, app, onToggle, onReset }) {
  const { t } = useLang();

  const rateClass = 'p-rate' + (sRate === 0 ? '' : sRate < 32 ? ' active' : ' warn');
  const splitClass = 'p-split' + (split === '–:––' ? ' dim' : '');

  const isRunning = app === 'running';
  const goText = app === 'paused' ? t('btnResume') : t('btnStart');
  const dangerText = isRunning ? t('btnStop') : t('reset');
  const dangerAction = isRunning ? onToggle : onReset;

  return (
    <div id="portrait">
      <div className="p-rate-block">
        <div className="p-lbl">{t('rateLbl')}</div>
        <div className={rateClass}>{sRate}</div>
        <div className="p-unit">{t('rateUnit')}</div>
        <div className={splitClass}>{split}</div>
        <div className="p-split-lbl">{t('splitLbl')}</div>
      </div>
      <div className="p-grid">
        <div className="p-cell">
          <div className="p-val">{elapsed}</div>
          <div className="p-meta">{t('time')}</div>
        </div>
        <div className="p-cell">
          <div className="p-val">{tDist.val}<span className="p-unit-sm">{tDist.unit}</span></div>
          <div className="p-meta">{t('dist')}</div>
        </div>
        <div className="p-cell">
          <div className="p-val">{avgRate}</div>
          <div className="p-meta">{t('avgRate')}</div>
        </div>
        <div className="p-cell">
          <div className="p-val">{avgSplit}</div>
          <div className="p-meta">{t('avgSplit')}</div>
        </div>
      </div>
      <div className="p-ctrl">
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
    </div>
  );
}
