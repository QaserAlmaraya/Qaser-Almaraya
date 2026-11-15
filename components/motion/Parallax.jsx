'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Public-site depth: the large section photos drift a little slower than the
// page while it scrolls, inside their own frame.
//
// The move is written to the image's own `translate` property (not
// `transform`), so it cannot fight the hover zoom that already animates
// `transform` on the same images, nor the fade-up that ScrollReveal puts on
// the whole section. The class qm-px (app/qs-motion-page.css) enlarges the
// image slightly so the frame never shows a gap. Classes are added by JS only:
// no-JS visitors, reduced-motion users and the dashboard see plain photos.

const SKIP_PATH = /^\/(admin|staff|api)(\/|$)/;

// Photos that sit in a clipping frame and fill it (object-fit: cover):
//   .qs-photo img        home "why us" photo, milestones, destination tiles
//   .qs-pd-hero-img      the banner photo on a package page
//   [data-parallax] img  opt-in for future sections
const PHOTOS = '.qs-photo img, .qs-pd-hero > img.qs-pd-hero-img, [data-parallax] img';
// Never touched: the home hero, package cards and stories (owned elsewhere),
// the fares board, the globe, site chrome, and anything that opts out.
const NOPE = '[data-no-parallax], .qh, .qs-fb, .qs-globe, .qa-offer, .qa-offer-img, .qa-pkg-card, ' +
  '[class*="qs-st-"], .qs-skel, header, footer, nav, .qn-menu';

const MAX_DESKTOP = 24;   // px of travel each way
const MAX_PHONE = 12;
const SHARE = 0.035;      // of the frame height; the 1.08 scale gives 4% spare per side
const MIN_W = 200, MIN_H = 140;   // smaller frames are thumbnails, not section photos

export default function Parallax() {
  const path = usePathname() || '/';

  useEffect(() => {
    if (SKIP_PATH.test(path)) return undefined;
    if (!('IntersectionObserver' in window) || !window.CSS || !CSS.supports || !CSS.supports('translate', '0 1px')) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const root = document.documentElement;
    const isSite = () => root.dataset.area === 'site';
    const phone = window.matchMedia('(max-width: 820px)');
    let alive = true, raf = 0, pend = 0, io = null, mo = null;
    const seen = new WeakSet();    // images already judged (taken or refused)
    const items = new Map();       // frame element -> { img, frame }
    const visible = new Set();     // items whose frame is near the viewport

    // One pass per frame: read every visible frame's position first, then write.
    const paint = () => {
      raf = 0;
      if (!alive || !visible.size) return;
      const vh = window.innerHeight;
      const max = phone.matches ? MAX_PHONE : MAX_DESKTOP;
      const moves = [];
      visible.forEach((it) => {
        const r = it.frame.getBoundingClientRect();
        if (!r.height) return;
        // -1 when the frame is just above the screen, 0 centred, 1 just below.
        let p = (r.top + r.height / 2 - vh / 2) / ((vh + r.height) / 2);
        p = p < -1 ? -1 : p > 1 ? 1 : p;
        const travel = Math.min(max, r.height * SHARE);
        moves.push(it.img, (-p * travel).toFixed(1));
      });
      for (let i = 0; i < moves.length; i += 2) moves[i].style.translate = '0 ' + moves[i + 1] + 'px';
    };
    const queue = () => { if (!raf && visible.size) raf = requestAnimationFrame(paint); };

    const drop = (it) => {
      if (io) io.unobserve(it.frame);
      visible.delete(it);
      items.delete(it.frame);
      it.img.classList.remove('qm-px', 'qm-px-on');
      it.img.style.removeProperty('translate');
    };

    const scan = () => {
      pend = 0;
      if (!alive || !isSite()) return;
      // Forget photos React has removed (route content swapped, lists re-rendered).
      items.forEach((it) => { if (!it.img.isConnected || it.img.parentElement !== it.frame) drop(it); });

      const vh = window.innerHeight;
      const fresh = [];
      document.querySelectorAll(PHOTOS).forEach((img) => {
        if (seen.has(img)) return;
        const frame = img.parentElement;
        if (!frame || items.has(frame)) return;
        if (img.closest(NOPE)) { seen.add(img); return; }
        const r = frame.getBoundingClientRect();
        if (!r.height || !r.width) return;            // not laid out yet: look again on the next scan
        seen.add(img);
        if (r.width < MIN_W || r.height < MIN_H) return;
        // The frame must clip, otherwise the enlarged photo would spill out.
        const cs = getComputedStyle(frame);
        const clips = (v) => v === 'hidden' || v === 'clip';
        if (!clips(cs.overflowX) || !clips(cs.overflowY)) return;
        fresh.push({ img, frame, inView: r.top < vh && r.bottom > 0 });
      });
      // Writes after all reads.
      fresh.forEach(({ img, frame, inView }) => {
        const it = { img, frame };
        items.set(frame, it);
        img.classList.add('qm-px');
        // A photo already on screen eases into its slightly larger size
        // instead of jumping. (Web Animations, so no CSS transition is touched.)
        if (inView && img.animate) {
          try { img.animate([{ scale: '1' }, { scale: '1.08' }], { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)' }); } catch { /* ignore */ }
        }
        io.observe(frame);
      });
    };

    const start = () => {
      if (!alive || !isSite()) return;
      // Off-screen photos cost nothing: only frames near the viewport are moved.
      io = new IntersectionObserver((es) => {
        es.forEach((e) => {
          const it = items.get(e.target);
          if (!it) return;
          if (e.isIntersecting) visible.add(it); else visible.delete(it);
          it.img.classList.toggle('qm-px-on', e.isIntersecting);
        });
        queue();
      }, { rootMargin: '80px 0px 80px 0px' });
      scan();
      // Sections render late (client fetches): rescan, throttled, on DOM changes.
      mo = new MutationObserver(() => { if (!pend) pend = setTimeout(scan, 160); });
      mo.observe(document.body, { childList: true, subtree: true });
      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', queue, { passive: true });
    };
    // Defer a tick so AreaMark has updated data-area after client navigation.
    const t0 = setTimeout(start, 60);

    return () => {
      alive = false;
      clearTimeout(t0); clearTimeout(pend);
      if (raf) cancelAnimationFrame(raf);
      if (mo) mo.disconnect();
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      [...items.values()].forEach(drop);
      if (io) io.disconnect();
    };
  }, [path]);

  return null;
}
