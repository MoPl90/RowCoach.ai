import { useLang } from '../context/LangContext';

export default function PermOverlay({ onGrant, onSkip }) {
  const { t } = useLang();
  return (
    <div className="perm">
      <h2>{t('appName')}</h2>
      <p>{t('permBody')}</p>
      <button className="perm-btn" onClick={onGrant}>{t('permBtn')}</button>
      <button className="perm-skip" onClick={onSkip}>{t('permSkip')}</button>
    </div>
  );
}
