import RateBlock from './RateBlock';
import SplitBlock from './SplitBlock';
import ControlBlock from './ControlBlock';

export default function CenterPanel({ sRate, sOn, split, app, onToggle, onReset, onSensChange, sensFillRef }) {
  return (
    <div className="panel panel-main">
      <RateBlock sRate={sRate} sOn={sOn} sensFillRef={sensFillRef} />
      <SplitBlock split={split} />
      <ControlBlock app={app} onToggle={onToggle} onReset={onReset} onSensChange={onSensChange} sOn={sOn} />
    </div>
  );
}
