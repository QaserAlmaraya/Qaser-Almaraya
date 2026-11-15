'use client';
import { useEffect, useRef, useState } from 'react';

// A statistic that counts up from 0 the first time it scrolls into view.
//
//   <CountUp value={1000000} prefix="+" />   →   +1,000,000
//
// Why it is built this way:
// - The server (and the first client render) prints the final text, so people
//   without JavaScript, crawlers and link previews always read the real number.
// - After mount the number is only reset to 0 when it sits below the fold. A
//   number that is already on screen stays put: resetting it would flash.
// - While it counts, the box keeps the width of the final text, so the label
//   beside it does not slide as digits are added.
// - The digits live in a `data-no-i18n` element: the Arabic→English dictionary
//   (lib/i18n.js) skips those, so it never sees the in-between values.
// - `prefers-reduced-motion` and browsers without IntersectionObserver simply
//   keep the final value.
// Only pass numbers the page already states. Digits are Western with
// thousands separators, the same as prices across the site.

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('en-US');

export default function CountUp({ value, prefix = '', suffix = '', duration = 900, className = '' }) {
  const ref = useRef(null);
  // null = show the final value. While counting: { n: current number, w: reserved width in px }.
  const [run, setRun] = useState(null);

  useEffect(() => {
    const el = ref.current;
    const target = Math.round(Number(value) || 0);
    if (!el || target <= 0) return undefined;
    if (typeof IntersectionObserver === 'undefined' || !window.requestAnimationFrame) return undefined;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const rect = el.getBoundingClientRect();
    // On screen already (or above it, or not laid out at all): leave it alone.
    if (rect.top < window.innerHeight) return undefined;

    const w = Math.ceil(rect.width);
    let raf = 0;
    let done = false;
    const finish = () => { done = true; cancelAnimationFrame(raf); setRun(null); };
    setRun({ n: 0, w });

    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      let start = 0;
      const step = (now) => {
        if (done) return;
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        if (t >= 1) { finish(); return; }
        const eased = 1 - Math.pow(1 - t, 3); // ease-out: quick start, soft landing, no overshoot
        setRun({ n: Math.round(target * eased), w });
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { rootMargin: '0px 0px -8% 0px' }); // start once it is properly inside the screen
    io.observe(el);

    // A printed page must never carry a half-counted number.
    window.addEventListener('beforeprint', finish);
    return () => {
      io.disconnect();
      window.removeEventListener('beforeprint', finish);
      finish();
    };
  }, [value, duration]);

  const text = prefix + fmt(run ? run.n : value) + suffix;
  return (
    <span
      ref={ref}
      data-no-i18n=""
      className={'qm-count' + (className ? ' ' + className : '')}
      style={run ? { minWidth: run.w } : undefined}
    >{text}</span>
  );
}
