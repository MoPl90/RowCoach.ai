import { useLang } from '../../context/LangContext';

export default function SplitBlock({ split }) {
  const { t } = useLang();
  const isDim = split === '–:––';
  return (
    <div className="split-block">
      <div className="split-lbl">{t('splitLbl')}</div>
      <div className={'split-num' + (isDim ? ' dim' : '')}>{split}</div>
    </div>
  );
}
