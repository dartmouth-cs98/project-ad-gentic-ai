import { useState, useEffect } from 'react';

/** Returns elapsed seconds since mount at ~60fps. Guards against prefers-reduced-motion. */
export function useAmbient(active = true): number {
  const [t, setT] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!active || reduced) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return t;
}
