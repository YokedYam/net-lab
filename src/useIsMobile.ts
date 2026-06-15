import { useEffect, useState } from 'react';

// Phones get the focused, touch-first study layout; tablets and up keep the full
// desktop shell (the Packet Tracer canvas, guided missions, three-pane lab).
// 720px is the line where the canvas and the wide study grids stop fitting.
export const MOBILE_QUERY = '(max-width: 720px)';

function matches(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(MOBILE_QUERY).matches;
}

// Live boolean for "are we on a phone-sized screen", kept in sync with the media
// query so rotating or resizing re-renders the right layout.
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(matches);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return isMobile;
}
