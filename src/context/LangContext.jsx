import { createContext, useContext, useState } from 'react';

const TR = {
  de: {
    appName: 'Row Pacer',
    permBody: 'Die App benötigt Zugriff auf den Bewegungssensor zur Schlagzählung sowie GPS für Strecke und Tempo.',
    permBtn: 'Berechtigungen erteilen',
    permSkip: 'Überspringen',
    mapMsg: 'Karte erscheint\nmit GPS-Signal',
    rateLbl: 'Schläge / min',
    rateUnit: 'S / MIN',
    splitLbl: 'Split / 500 m',
    sens: 'Sens',
    reset: '↺ Zurücksetzen',
    statsHdr: 'Statistik',
    forceHdr: 'Kraftkurve',
    tap: 'antippen',
    time: 'Zeit',
    dist: 'Distanz',
    avgSplit: 'Ø Split / 500 m',
    curRate: 'Schlagzahl',
    avgRate: 'Ø Schlagzahl',
    curMps: 'Meter / Schlag',
    avgMps: 'Ø Meter / Schlag',
    restoreDefaults: 'Standard',
    btnStart: 'Start', btnStop: 'Stop', btnResume: 'Weiter',
    statusRec: 'Aufzeichnung · Sensor',
    statusPaused: 'Pausiert',
    noSensor: 'Sensor nicht aktiv',
  },
  en: {
    appName: 'Row Pacer',
    permBody: 'The app needs access to the motion sensor for stroke counting and GPS for distance and pace.',
    permBtn: 'Grant Permissions',
    permSkip: 'Skip',
    mapMsg: 'Map appears\nwith GPS signal',
    rateLbl: 'Strokes / min',
    rateUnit: 'S / MIN',
    splitLbl: 'Split / 500 m',
    sens: 'Sens',
    reset: '↺ Reset',
    statsHdr: 'Statistics',
    forceHdr: 'Force Curve',
    tap: 'tap',
    time: 'Time',
    dist: 'Distance',
    avgSplit: 'Ø Split / 500 m',
    curRate: 'Stroke Rate',
    avgRate: 'Ø Stroke Rate',
    curMps: 'm / Stroke',
    avgMps: 'Ø m / Stroke',
    restoreDefaults: 'Restore Defaults',
    btnStart: 'Start', btnStop: 'Stop', btnResume: 'Resume',
    statusRec: 'Recording · Sensor',
    statusPaused: 'Paused',
    noSensor: 'Sensor inactive',
  }
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  function toggleLang() {
    const next = lang === 'de' ? 'en' : 'de';
    localStorage.setItem('lang', next);
    setLang(next);
  }

  const t = (key) => TR[lang][key] ?? key;

  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
