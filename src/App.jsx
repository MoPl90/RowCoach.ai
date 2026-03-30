import { useRef, useState } from 'react';
import { useSession } from './hooks/useSession';
import { useDevMode } from './hooks/useDevMode';
import Header from './components/Header';
import PermOverlay from './components/PermOverlay';
import MapPanel from './components/map/MapPanel';
import CenterPanel from './components/center/CenterPanel';
import RightPanel from './components/right/RightPanel';
import PortraitLayout from './components/portrait/PortraitLayout';
import DevOverlay from './components/dev/DevOverlay';

// ── Formatters ──
function fmtT(s) {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
function fmtSplit(v) {
  if (v < 0.3) return '–:––';
  const t = 500 / v;
  if (t > 600) return '–:––';
  const m = Math.floor(t / 60), s = t % 60;
  return m + ':' + String(Math.floor(s)).padStart(2, '0') + '.' + Math.floor((s % 1) * 10);
}

export default function App() {
  const [permDismissed, setPermDismissed] = useState(() =>
    localStorage.getItem('permDismissed') === '1'
  );
  const mapRef = useRef(null);
  const sensFillRef = useRef(null);
  const isDevMode = useDevMode();

  const {
    app, sRate, sCount, tDist, elapsed, curSpd,
    sOk, sOn, gpsPermOk, gpsGot,
    toggleRun, doReset, requestPermissions,
    setSens, setCurSpd,
    forceBuf, forceBufIdx, forceMax, recentStrokeTimes,
    stroke,
  } = useSession({ mapRef, sensFillRef });

  // Derived display values
  const split = fmtSplit(curSpd);
  const mins = elapsed / 60;
  const avgRate = mins > 0 && sCount > 0 ? Math.round(sCount / mins) : 0;
  const avgSplit = tDist > 10 && elapsed > 5 ? fmtSplit(tDist / elapsed) : '–:––';
  const distVal = tDist >= 1000 ? (tDist / 1000).toFixed(2) : String(Math.round(tDist));
  const distUnit = tDist >= 1000 ? ' km' : ' m';
  const avgMps = sCount > 0 ? (tDist / sCount).toFixed(1) : '0.0';
  const curMps = sRate > 0 && curSpd > 0 ? (curSpd * 60 / sRate).toFixed(1) : '0.0';

  async function handleGrant() {
    await requestPermissions();
    localStorage.setItem('permDismissed', '1');
    setPermDismissed(true);
  }

  function handleSkip() {
    setPermDismissed(true);
  }

  function handleReset() {
    doReset();
    mapRef.current?.resetTrack();
  }

  return (
    <>
      <div id="flash" className="flash" />

      {!permDismissed && (
        <PermOverlay
          onGrant={handleGrant}
          onSkip={handleSkip}
        />
      )}

      <div className="shell">
        <Header app={app} sOk={sOk} gpsPermOk={gpsPermOk} gpsGot={gpsGot} />

        {/* Landscape cockpit */}
        <div className="cockpit">
          <MapPanel ref={mapRef} />
          <CenterPanel
            sRate={sRate} sOn={sOn} split={split}
            app={app} onToggle={toggleRun} onReset={handleReset}
            onSensChange={setSens} sensFillRef={sensFillRef}
          />
          <RightPanel
            time={fmtT(elapsed)}
            dist={distVal} distUnit={distUnit}
            curSplit={split} avgSplit={avgSplit}
            curRate={sRate} avgRate={avgRate}
            curMps={curMps} avgMps={avgMps}
            forceBuf={forceBuf} forceBufIdx={forceBufIdx} forceMax={forceMax}
            recentStrokeTimes={recentStrokeTimes} sOk={sOk}
          />
        </div>

        {/* Portrait layout */}
        <PortraitLayout
          sRate={sRate} split={split}
          elapsed={fmtT(elapsed)}
          tDist={{ val: distVal, unit: distUnit }}
          avgRate={avgRate} avgSplit={avgSplit}
          app={app} onToggle={toggleRun} onReset={handleReset}
        />
      </div>

      {isDevMode && (
        <DevOverlay stroke={stroke} setCurSpd={setCurSpd} />
      )}
    </>
  );
}
