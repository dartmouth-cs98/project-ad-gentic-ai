import { useEffect, useState } from 'react';

function outCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** Tweens from 0 to `target` over `durationMs` once `active` is true. */
export function useCountUp(
  target: number,
  { durationMs = 1100, active = true }: { durationMs?: number; active?: boolean } = {},
): number {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!active) {
      setVal(0);
      return;
    }
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setVal(target * outCubic(t));
      if (t < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, active]);

  return val;
}
