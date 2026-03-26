import { useLang } from '../../context/LangContext';

export default function RateBlock({ sRate, sOn, sensFillRef }) {
  const { t } = useLang();
  const rateClass = 'rate-num' + (sRate === 0 ? '' : sRate < 32 ? ' active' : ' warn');

  return (
    <div className="rate-block">
      <div className="rate-lbl">{t('rateLbl')}</div>
      <div className={rateClass}>{sRate}</div>
      <div className={'sens-bar' + (sOn ? ' show' : '')}>
        <div className="sens-fill" ref={sensFillRef} />
      </div>
      <div className="rate-unit">{t('rateUnit')}</div>
    </div>
  );
}
