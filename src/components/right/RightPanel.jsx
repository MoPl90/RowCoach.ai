import { useState } from 'react';
import { useLang } from '../../context/LangContext';
import StatsGrid from './StatsGrid';
import ForceCanvas from './ForceCanvas';

export default function RightPanel({
  time, dist, distUnit, avgSplit, avgRate, mps, curSplit,
  forceBuf, forceBufIdx, forceMax, recentStrokeTimes, sOk,
}) {
  const { t } = useLang();
  const [mode, setMode] = useState('stats');

  function toggleMode() {
    setMode(m => m === 'stats' ? 'force' : 'stats');
  }

  return (
    <div className="panel panel-right">
      {mode === 'stats' ? (
        <StatsGrid
          time={time} dist={dist} distUnit={distUnit} avgSplit={avgSplit}
          avgRate={avgRate} mps={mps} curSplit={curSplit}
          onToggleMode={toggleMode}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="stats-hdr" style={{ cursor: 'pointer' }} onClick={toggleMode}>
            <span>{t('forceHdr')}</span>{' '}
            <span style={{ color: 'var(--g3)', fontSize: '.4rem', letterSpacing: '.05em' }}>{t('tap')}</span>
          </div>
          <ForceCanvas
            forceBuf={forceBuf} forceBufIdx={forceBufIdx} forceMax={forceMax}
            recentStrokeTimes={recentStrokeTimes} sOk={sOk}
          />
        </div>
      )}
    </div>
  );
}
