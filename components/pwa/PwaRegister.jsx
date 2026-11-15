'use client';
import { useEffect } from 'react';

// Registers the minimal service worker (public/sw.js): production builds only,
// public site only (never from /admin or /staff), after the page has loaded.
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return undefined;
    if (!('serviceWorker' in navigator)) return undefined;
    if (/^\/(admin|staff)(\/|$)/.test(window.location.pathname)) return undefined;
    const register = () => { navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => { /* not fatal */ }); };
    if (document.readyState === 'complete') { register(); return undefined; }
    window.addEventListener('load', register, { once: true });
    return () => window.removeEventListener('load', register);
  }, []);
  return null;
}
