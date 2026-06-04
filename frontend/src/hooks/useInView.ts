import { useState, useEffect, type RefObject } from 'react';

/** Returns true once the element enters the viewport. Never flips back. */
export function useInView(ref: RefObject<HTMLElement | null>, threshold = 0.15): boolean {
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { setSeen(true); io.disconnect(); }
        }
      },
      { threshold },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return seen;
}
