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
  const fx = flightFx(next, x0, y0, cx, cy, angle, seen, end, frames.length - 1, fly);
  const done = () => { root.classList.remove('qt-vt'); fx(); };
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

// The visible plane that flies with the reveal: a white silhouette with a
// glow, a dashed contrail drawn behind it and a ring that pops at the switch.
// Everything lives in one fixed layer that removes itself when the change ends.
function flightFx(next, x0, y0, cx, cy, angle, seen, end, steps, fly) {
  const NS = 'http://www.w3.org/2000/svg';
  const w = window.innerWidth, h = window.innerHeight;
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.className = 'qt-fx';
  const dark = next === 'dark';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', w); svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const line = document.createElementNS(NS, 'line');
  line.setAttribute('x1', x0); line.setAttribute('y1', y0); line.setAttribute('x2', cx); line.setAttribute('y2', cy);
  line.setAttribute('stroke', dark ? '#9fe3ff' : '#faab18');
  line.setAttribute('stroke-width', '3'); line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-dasharray', '2 11');
  const len = Math.hypot(cx - x0, cy - y0);
  svg.appendChild(line);
  const ring = document.createElement('i');
  ring.className = 'qt-ring';
  ring.style.cssText = `left:${x0}px;top:${y0}px;border-color:${dark ? '#9fe3ff' : '#faab18'}`;
  const jet = document.createElementNS(NS, 'svg');
  jet.setAttribute('viewBox', '-1 -1 2 2');
  jet.setAttribute('class', 'qt-jet');
  const poly = document.createElementNS(NS, 'polygon');
  poly.setAttribute('points', PLANE.map((q) => q.join(',')).join(' '));
  poly.setAttribute('fill', '#fff');
  poly.setAttribute('stroke', dark ? '#45c3ec' : '#faab18');
  poly.setAttribute('stroke-width', '0.05');
  jet.appendChild(poly);
  jet.style.cssText = `width:${seen * 2}px;height:${seen * 2}px;left:${-seen}px;top:${-seen}px`;
  layer.append(svg, ring, jet);
  document.body.appendChild(layer);
  const total = 1300, tFly = total * (fly / steps);
  const kf = [];
  for (let i = 0; i <= fly; i++) {
    const t = i / fly, e = 1 - Math.pow(1 - t, 2);
    const sc = (16 + (seen - 16) * t * t) / seen;
    kf.push({ transform: `translate(${x0 + (cx - x0) * e}px,${y0 + (cy - y0) * e}px) rotate(${angle}rad) scale(${sc})`, opacity: 1 });
  }
  const last = kf[kf.length - 1].transform;
  kf.push({ transform: last.replace(/scale\([^)]*\)/, 'scale(1.35)'), opacity: 0 });
  const opts = { duration: total, easing: 'linear', fill: 'both' };
  const stops = fly + 1;
  const offs = kf.map((_, i) => (i < stops ? (i / fly) * (tFly / total) : 1));
  jet.animate(kf.map((k, i) => ({ ...k, offset: offs[i] })), opts);
  line.animate([
    { strokeDashoffset: 0, opacity: 0.9, offset: 0 },
    { strokeDashoffset: -len / 4, opacity: 0.9, offset: tFly / total },
    { strokeDashoffset: -len / 3, opacity: 0, offset: 1 },
  ], opts);
  ring.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(3.2)', opacity: 0 }], { duration: 650, easing: 'ease-out', fill: 'both' });
  return () => setTimeout(() => layer.remove(), 60);
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
    const b = e.currentTarget;
    b.classList.remove('qt-pop'); void b.offsetWidth; b.classList.add('qt-pop');
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
