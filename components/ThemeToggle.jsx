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

// The change: a black hole opens at the switch and a circle of the new look
// grows out of it, with a band of warm (going light) or cool (going dark)
// light travelling on its edge.
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
  // Far corner: the circle has to reach it, and the plane flies towards it.
  const fx = x0 < w / 2 ? w : 0, fy = y0 < h / 2 ? h : 0;
  const R = Math.hypot(fx - x0, fy - y0) + 4;
  const ang = Math.atan2(fy - y0, fx - x0);
  const dur = 1200, ease = 'cubic-bezier(.55,.05,.25,1)';

  root.classList.add('qt-vt');
  const vt = document.startViewTransition(run);
  const fxDone = flight(next === 'dark', x0, y0, R, ang, dur, ease);
  const done = () => { root.classList.remove('qt-vt'); fxDone.end(); };
  vt.ready.then(() => {
    fxDone.play();
    root.animate(
      { clipPath: [`circle(0px at ${x0}px ${y0}px)`, `circle(${R}px at ${x0}px ${y0}px)`] },
      { duration: dur, easing: ease, pseudoElement: '::view-transition-new(root)', fill: 'both' });
  }).catch(done);
  vt.finished.then(done, done);
}

function flight(dark, x0, y0, R, ang, dur, ease) {
  const layer = document.createElement('div');
  layer.className = 'qt-fx';
  layer.setAttribute('aria-hidden', 'true');
  const o = { duration: dur, easing: ease, fill: 'both' };
  const glow = dark ? 'rgba(140,170,255,.8)' : 'rgba(255,190,70,.85)';

  // Light travelling with the circle's edge.
  const band = document.createElement('i');
  band.className = 'qt-band';
  band.style.cssText = `left:${x0 - R}px;top:${y0 - R}px;width:${R * 2}px;height:${R * 2}px;box-shadow:inset 0 0 0 2px ${glow},inset 0 0 40px 10px ${glow},0 0 40px 14px ${glow}`;
  band.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(.82)', opacity: 1, offset: .82 }, { transform: 'scale(1)', opacity: 0 }], o);

  // The black hole (white hole when going light): a dark core inside a turning
  // accretion ring, born at the switch; it swells, then collapses.
  const hole = document.createElement('i');
  hole.className = 'qt-hole' + (dark ? '' : ' qt-white');
  hole.style.cssText = `left:${x0}px;top:${y0}px`;
  hole.animate([
    { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .18 },
    { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 1, offset: .5 },
    { transform: 'translate(-50%,-50%) scale(.1)', opacity: 0 }], { duration: dur, easing: 'ease-in-out', fill: 'both' });
  const ring = document.createElement('i');
  hole.appendChild(ring);
  ring.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(720deg)' }], { duration: dur, easing: 'linear', fill: 'both' });

  layer.append(band, hole);
  document.body.appendChild(layer);
  // Held until the page snapshot is ready, so everything moves with the circle.
  const anims = layer.getAnimations({ subtree: true });
  anims.forEach((a) => a.pause());
  return { play: () => anims.forEach((a) => a.play()), end: () => setTimeout(() => layer.remove(), 80) };
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
      <i className="qt-sky" aria-hidden="true" />
      <i className="qt-orb" aria-hidden="true">
        <Icon name="sun" size={17} strokeWidth={2} />
        <Icon name="moon" size={15} strokeWidth={2} />
      </i>
    </button>
  );
}
