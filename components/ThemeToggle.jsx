'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Icon from './Icon';

// Light / dark switch for the public site. The choice lives on
// <html data-theme> (set before paint by the inline script in app/layout.js)
// and in localStorage. Dark styles exist only under data-area="site", so the
// dashboard never changes even if the attribute is present.
const KEY = 'qs-theme';
const EVT = 'qs-theme-change';
// Pages that keep their own fixed look.
const LIGHT_ONLY = /^\/links(\/|$)/;

function stored() {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}
function paint(theme, path) {
  const root = document.documentElement;
  if (theme === 'dark' && !LIGHT_ONLY.test(path || location.pathname)) root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
}

// A plane seen from above, nose up, in units of its own half-length.
const PLANE = [
  [0, -1], [0.05, -0.93], [0.085, -0.78], [0.09, -0.3], [0.95, 0.16], [0.95, 0.3], [0.09, 0.14],
  [0.08, 0.62], [0.36, 0.84], [0.36, 0.95], [0.05, 0.88], [0, 1],
  [-0.05, 0.88], [-0.36, 0.95], [-0.36, 0.84], [-0.08, 0.62], [-0.09, 0.14], [-0.95, 0.3], [-0.95, 0.16],
  [-0.09, -0.3], [-0.085, -0.78], [-0.05, -0.93],
];
const BODY = 0.085; // the widest circle around the centre that fits inside the plane

function planeAt(x, y, size, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return 'polygon(' + PLANE.map(([px, py]) =>
    `${(x + (px * c - py * s) * size).toFixed(1)}px ${(y + (px * s + py * c) * size).toFixed(1)}px`).join(',') + ')';
}

function change(next, origin) {
  const run = () => {
    try { localStorage.setItem(KEY, next); } catch {}
    paint(next);
    window.dispatchEvent(new Event(EVT));
  };
  const root = document.documentElement;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !document.startViewTransition || root.classList.contains('qt-vt')) { run(); return; }

  const w = window.innerWidth, h = window.innerHeight;
  const x0 = origin ? origin.x : w / 2, y0 = origin ? origin.y : 0;
  const cx = w / 2, cy = h / 2;
  // The plane leaves the switch, flies to the middle of the screen while it
  // grows to a size you can read, then opens up until it covers the page.
  const angle = Math.atan2(cy - y0, cx - x0) + Math.PI / 2;
  const seen = Math.min(w, h) * 0.42;
  const end = (Math.hypot(cx, cy) / BODY) * 1.05;
  const frames = [];
  const fly = 9, open = 7;
  for (let i = 0; i <= fly; i++) {
    const t = i / fly, e = 1 - Math.pow(1 - t, 2);
    frames.push(planeAt(x0 + (cx - x0) * e, y0 + (cy - y0) * e, 16 + (seen - 16) * t * t, angle));
  }
  for (let i = 1; i <= open; i++) frames.push(planeAt(cx, cy, seen * Math.pow(end / seen, i / open), angle));

  root.classList.add('qt-vt');
  const vt = document.startViewTransition(run);
  const done = () => root.classList.remove('qt-vt');
  vt.ready.then(() => {
    const opts = { duration: 1300, easing: 'linear', pseudoElement: '::view-transition-new(root)', fill: 'both' };
    root.animate({ clipPath: frames }, opts);
    // Photos look the same in both modes, so the plane would vanish over them.
    // Inside the plane the page is dimmed (going dark) or lit (going light)
    // until it opens up, which keeps the shape readable on any background.
    const tint = next === 'dark' ? 'brightness(.5) saturate(.8)' : 'brightness(1.55) saturate(.75)';
    root.animate({ filter: [tint, tint, 'brightness(1) saturate(1)'], offset: [0, 0.62, 1] }, opts);
  }).catch(done);
  vt.finished.then(done, done);
}

export function ThemeSync() {
  const path = usePathname() || '/';
  useEffect(() => { paint(stored(), path); }, [path]);
  return null;
}

export default function ThemeToggle({ lang = 'ar', className = '' }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () => setDark(stored() === 'dark');
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const en = lang === 'en';
  const label = en ? (dark ? 'Switch to light mode' : 'Switch to dark mode') : (dark ? 'الوضع النهاري' : 'الوضع الليلي');
  const onClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    change(dark ? 'light' : 'dark', { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label={label} title={label} data-no-i18n="" data-no-vt="" className={('qt-switch ' + className).trim()} onClick={onClick}>
      <span aria-hidden="true"><Icon name="sun" size={17} strokeWidth={2} /></span>
      <span aria-hidden="true"><Icon name="moon" size={16} strokeWidth={2} /></span>
    </button>
  );
}
