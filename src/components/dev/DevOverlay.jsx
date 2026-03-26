import { useRef, useState } from 'react';

export default function DevOverlay({ stroke, setCurSpd }) {
  const [autoOn, setAutoOn] = useState(false);
  const [spm, setSpm] = useState(20);
  const autoId = useRef(null);

  function ms() { return 60000 / spm; }

  function handleStroke() { stroke(Date.now()); }

  function handleAuto() {
    if (autoOn) {
      clearInterval(autoId.current);
      autoId.current = null;
      setAutoOn(false);
    } else {
      autoId.current = setInterval(() => stroke(Date.now()), ms());
      setAutoOn(true);
    }
  }

  function handleSpmChange(e) {
    const v = parseFloat(e.target.value || 20);
    setSpm(v);
    if (autoOn) {
      clearInterval(autoId.current);
      autoId.current = setInterval(() => stroke(Date.now()), 60000 / v);
    }
  }

  function handleSpd(e) {
    setCurSpd(parseFloat(e.target.value || 0) / 3.6);
  }

  const btnStyle = {
    background: '#1f1f1f', border: '1px solid #444', color: '#fff',
    fontFamily: 'var(--font)', fontSize: '.65rem', letterSpacing: '.1em',
    textTransform: 'uppercase', padding: '.45rem .8rem', cursor: 'pointer',
  };
  const inputStyle = {
    background: '#111', border: '1px solid #333', color: '#fff',
    fontFamily: 'var(--font)', fontSize: '.65rem', textAlign: 'center', padding: '.3rem',
  };
  const labelStyle = { fontSize: '.5rem', color: '#666', letterSpacing: '.08em' };

  return (
    <div style={{
      position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: '.4rem', alignItems: 'flex-end',
    }}>
      <div style={{ background: '#1f1f1f', border: '1px solid #333', padding: '.5rem .7rem', fontSize: '.55rem', letterSpacing: '.1em', color: '#888', textTransform: 'uppercase' }}>Dev Mode</div>
      <button style={btnStyle} onClick={handleStroke}>Stroke</button>
      <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
        <button
          style={{ ...btnStyle, borderColor: autoOn ? 'var(--red)' : '#444' }}
          onClick={handleAuto}
        >Auto: {autoOn ? 'On' : 'Off'}</button>
        <input type="number" value={spm} min="10" max="50" style={{ ...inputStyle, width: '3rem' }} onChange={handleSpmChange} />
        <span style={labelStyle}>SPM</span>
      </div>
      <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
        <span style={{ ...labelStyle, textTransform: 'uppercase' }}>Speed</span>
        <input type="number" defaultValue="0" min="0" max="20" step="0.1" style={{ ...inputStyle, width: '3.5rem' }} onInput={handleSpd} />
        <span style={labelStyle}>km/h</span>
      </div>
    </div>
  );
}
