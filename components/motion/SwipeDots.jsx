'use client';
import { useEffect, useState } from 'react';

// Position dots for a CSS scroll-snap row (the swipe itself is pure CSS).
//
//   <div ref={row} className="…scroll-snap row…">…cards…</div>
//   <SwipeDots scroller={row} count={cards.length} label={(i, n) => `Offer ${i} of ${n}`} />
//
// Why it is built this way:
// - No scroll listener. An IntersectionObserver rooted on the row reports
//   which card is most on show, which costs nothing while the finger moves
//   and gives the same answer in RTL and LTR (scrollLeft has a different sign
//   in each, card visibility does not).
// - Tapping a dot scrolls by the visual distance between the card and the
//   row's leading edge, so it is also direction-agnostic and never moves the
//   page vertically (scrollIntoView could).
// The dots are hidden by CSS wherever the row is not a swipe row
// (app/qs-motion-cards.css).

export default function SwipeDots({ scroller, count, label }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const row = scroller && scroller.current;
    if (!row || count < 2 || typeof IntersectionObserver === 'undefined') return undefined;
    const cards = Array.from(row.children).slice(0, count);
    const seen = new Map(); // card -> how much of it is visible (0..1)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target, e.isIntersecting ? e.intersectionRatio : 0));
      let best = -1;
      let bestRatio = 0;
      cards.forEach((c, i) => { const r = seen.get(c) || 0; if (r > bestRatio + 0.01) { bestRatio = r; best = i; } });
      if (best >= 0) setActive(best);
    }, { root: row, threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] });
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [scroller, count]);

  if (count < 2) return null;

  const go = (i) => {
    const row = scroller && scroller.current;
    const card = row && row.children[i];
    if (!card) return;
    const rtl = getComputedStyle(row).direction === 'rtl';
    const a = row.getBoundingClientRect();
    const b = card.getBoundingClientRect();
    const dx = rtl ? b.right - a.right : b.left - a.left;
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollBy({ left: dx, behavior: calm ? 'auto' : 'smooth' });
  };

  return (
    <div className="qm-dots">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className={'qm-dot' + (i === active ? ' on' : '')}
          aria-label={label ? label(i + 1, count) : String(i + 1)}
          aria-current={i === active ? 'true' : undefined}
          onClick={() => go(i)}
        />
      ))}
    </div>
  );
}
