import { useRef, useEffect } from 'react';

export function useWakeLock() {
  const wakeLock = useRef(null);

  async function wlOn() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock.current = await navigator.wakeLock.request('screen');
      }
    } catch {}
  }

  function wlOff() {
    if (wakeLock.current) {
      wakeLock.current.release();
      wakeLock.current = null;
    }
  }

  return { wlOn, wlOff };
}
