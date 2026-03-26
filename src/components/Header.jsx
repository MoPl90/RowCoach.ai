import { useLang } from '../context/LangContext';
import { useTheme } from '../context/ThemeContext';

export default function Header({ app, sOk, gpsPermOk, gpsGot }) {
  const { t, lang, toggleLang } = useLang();
  const { toggleTheme, themeBtnLabel } = useTheme();

  let statusText = '';
  let live = false;

  if (app === 'running') {
    statusText = t('statusRec') + (gpsGot ? ' · GPS' : '');
    live = true;
  } else if (app === 'paused') {
    statusText = t('statusPaused');
  } else {
    const parts = [];
    if (sOk) parts.push('Sensor');
    if (gpsPermOk) parts.push('GPS');
    statusText = parts.join(' · ');
  }

  return (
    <div className="hdr">
      <span className="hdr-t">{t('appName')}</span>
      <span className={'hdr-s' + (live ? ' live' : '')}>{statusText}</span>
      <div style={{ display: 'flex', gap: '.6rem', alignItems: 'baseline' }}>
        <button className="theme-btn" onClick={toggleTheme}>{themeBtnLabel}</button>
        <button className="lang-btn" onClick={toggleLang}>{lang === 'de' ? 'EN' : 'DE'}</button>
      </div>
    </div>
  );
}
