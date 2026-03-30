import { useLang } from '../../context/LangContext';

export default function PortraitLayout({ sRate, split, elapsed, tDist, avgRate, avgSplit, app, onToggle, onReset }) {
  const { t } = useLang();

  const rateClass = 'p-rate' + (sRate === 0 ? '' : sRate < 32 ? ' active' : ' warn');
  const splitClass = 'p-split' + (split === '–:––' ? ' dim' : '');

  const btnText = app === 'running' ? t('btnStop') : app === 'paused' ? t('btnResume') : t('btnStart');
  const btnClass = 'main-btn' + (app === 'running' ? ' running' : '');

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
        <button className={btnClass} onClick={onToggle}>{btnText}</button>
        <button className="rst-btn" onClick={onReset} disabled={app === 'running'}>{t('reset')}</button>
      </div>
    </div>
  );
}
