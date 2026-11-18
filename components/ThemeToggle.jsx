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

// Airplane glyph: Phosphor Icons "airplane" (fill), MIT licence, nose up.
// https://github.com/phosphor-icons/core
const PLANE_PATH = 'M240,136v32a8,8,0,0,1-8,8,7.61,7.61,0,0,1-1.57-.16L156,161v23.73l17.66,17.65A8,8,0,0,1,176,208v24a8,8,0,0,1-11,7.43l-37-14.81L91,239.43A8,8,0,0,1,80,232V208a8,8,0,0,1,2.34-5.66L100,184.69V161L25.57,175.84A7.61,7.61,0,0,1,24,176a8,8,0,0,1-8-8V136a8,8,0,0,1,4.42-7.16L100,89.06V44a28,28,0,0,1,56,0V89.06l79.58,39.78A8,8,0,0,1,240,136Z';

// The change: a circle of the new look grows out of the switch. A plane rides
// its edge towards the far corner, drawing a dashed contrail, while a band of
// sunrise (going light) or dusk (going dark) light travels with the edge.
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
  const done = () => { root.classList.remove('qt-vt'); fxDone(); };
  vt.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x0}px ${y0}px)`, `circle(${R}px at ${x0}px ${y0}px)`] },
      { duration: dur, easing: ease, pseudoElement: '::view-transition-new(root)', fill: 'both' });
  }).catch(done);
  vt.finished.then(done, done);
}

function flight(dark, x0, y0, R, ang, dur, ease) {
  const NS = 'http://www.w3.org/2000/svg';
  const layer = document.createElement('div');
  layer.className = 'qt-fx';
  layer.setAttribute('aria-hidden', 'true');
  const o = { duration: dur, easing: ease, fill: 'both' };
  const glow = dark ? 'rgba(140,170,255,.8)' : 'rgba(255,190,70,.85)';

  // Light travelling with the circle's edge.
  const band = document.createElement('i');
  band.className = 'qt-band';
  band.style.cssText = `left:${x0 - R}px;top:${y0 - R}px;width:${R * 2}px;height:${R * 2}px;box-shadow:inset 0 0 0 2px ${glow},inset 0 0 40px 10px ${glow},0 0 40px 14px ${glow}`;
  band.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: .82 }, { transform: 'scale(1)', opacity: 0 }], o);

  // Contrail from the switch to the plane.
  const trail = document.createElement('i');
  trail.className = 'qt-trail';
  trail.style.cssText = `left:${x0}px;top:${y0}px;width:${R}px;transform:rotate(${ang}rad)`;
  trail.animate([
    { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
    { clipPath: 'inset(0 0% 0 0)', opacity: 1, offset: .82 },
    { clipPath: 'inset(0 0% 0 0)', opacity: 0 }], o);

  // The plane: nose points along the flight.
  const size = Math.max(46, Math.min(68, Math.min(window.innerWidth, window.innerHeight) * 0.12));
  const jet = document.createElementNS(NS, 'svg');
  jet.setAttribute('viewBox', '0 0 256 256');
  jet.setAttribute('class', 'qt-jet');
  jet.style.cssText = `left:${-size / 2}px;top:${-size / 2}px;width:${size}px;height:${size}px;color:#faab18`;
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', PLANE_PATH);
  path.setAttribute('fill', 'currentColor');
  jet.appendChild(path);
  const at = (t) => `translate(${x0 + Math.cos(ang) * R * t}px,${y0 + Math.sin(ang) * R * t}px) rotate(${ang + Math.PI / 2}rad)`;
  jet.animate([
    { transform: at(0) + ' scale(.5)', opacity: 1 },
    { transform: at(.82) + ' scale(1.15)', opacity: 1, offset: .82 },
    { transform: at(1.04) + ' scale(1.3)', opacity: 0 }], o);

  layer.append(band, trail, jet);
  document.body.appendChild(layer);
  return () => setTimeout(() => layer.remove(), 80);
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
