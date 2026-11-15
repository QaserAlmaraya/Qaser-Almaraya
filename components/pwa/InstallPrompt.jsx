'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getStoredLang } from '../../lib/i18n';

// "Add to home screen" card for phones and tablets on the public site.
// Android/Chromium: uses the browser's own install prompt (beforeinstallprompt).
// iOS Safari has no such prompt, so the card explains the two taps instead.
// Calm by design: waits 20 s and a bit of scrolling, never blocks the page,
// and after «لاحقاً» stays silent for 14 days.

const HIDE_ON = ['/admin', '/staff', '/login', '/links'];
const LATER_KEY = 'qs-install-later';
const LATER_MS = 14 * 24 * 60 * 60 * 1000;
const DELAY_MS = 20000;
const MIN_SCROLL = 320;

const T = {
  ar: {
    title: 'ثبّت تطبيق قصر المرايا على شاشتك',
    sub: 'يفتح مباشرة من الشاشة الرئيسية، بلا متجر تطبيقات.',
    install: 'ثبّت',
    later: 'لاحقاً',
    ios1: 'اضغط «مشاركة» في شريط المتصفح',
    ios2: 'ثم اختر «إضافة إلى الشاشة الرئيسية»',
    label: 'تثبيت التطبيق',
  },
  en: {
    title: 'Add Qaser Almaraya to your home screen',
    sub: 'Opens straight from your home screen. No app store needed.',
    install: 'Install',
    later: 'Later',
    ios1: 'Tap “Share” in the browser bar',
    ios2: 'Then choose “Add to Home Screen”',
    label: 'Install the app',
  },
};

function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch { return false; }
}

function isTouchDevice() {
  try {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  } catch { return false; }
}

// Real Safari on iPhone/iPad (other iOS browsers and in-app browsers are skipped).
function isIosSafari() {
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return false;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|FBAN|FBAV|Instagram|Line\/|GSA\//.test(ua);
}

function snoozed() {
  try {
    const at = Number(localStorage.getItem(LATER_KEY) || 0);
    return at > 0 && Date.now() - at < LATER_MS;
  } catch { return false; }
}

// Test hook for automated checks. Read only outside production builds, where
// this branch is compiled away, so no visitor or URL can ever trigger it.
function testHook() {
  if (process.env.NODE_ENV === 'production') return null;
  return (typeof window !== 'undefined' && window.__QS_PWA_TEST__) || null;
}

const ShareGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 15V3" /><path d="m8 7 4-4 4 4" /><path d="M8 10H6.5A1.5 1.5 0 0 0 5 11.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H16" />
  </svg>
);
const AddGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="3.5" /><path d="M12 8.5v7" /><path d="M8.5 12h7" />
  </svg>
);

export default function InstallPrompt() {
  const path = usePathname() || '/';
  const hiddenPath = HIDE_ON.some((p) => path.startsWith(p));
  const [lang, setLang] = useState('ar');
  const [mode, setMode] = useState(null); // 'android' | 'ios' | null (nothing to offer)
  const [ready, setReady] = useState(false); // delay passed and visitor has scrolled
  const [gone, setGone] = useState(false); // dismissed or installed in this visit
  const deferred = useRef(null);

  useEffect(() => {
    setLang(getStoredLang() === 'en' ? 'en' : 'ar');
    const on = (e) => (e?.detail === 'ar' || e?.detail === 'en') && setLang(e.detail);
    window.addEventListener('qa-lang-change', on);
    return () => window.removeEventListener('qa-lang-change', on);
  }, []);

  useEffect(() => {
    const hook = testHook();
    if (isStandalone() || snoozed()) return undefined;
    if (!isTouchDevice() && !hook?.touch) return undefined;

    const onPrompt = (e) => {
      e.preventDefault(); // keep the browser's own mini-bar away; we ask later, calmly
      deferred.current = e;
      setMode('android');
    };
    const onInstalled = () => { deferred.current = null; setGone(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if (isIosSafari() || hook?.ios) setMode('ios');

    const delay = hook && typeof hook.delayMs === 'number' ? hook.delayMs : DELAY_MS;
    const minScroll = hook && typeof hook.minScroll === 'number' ? hook.minScroll : MIN_SCROLL;
    let timeUp = false;
    let scrolled = false;
    const check = () => { if (timeUp && scrolled) setReady(true); };
    const onScroll = () => {
      if (window.scrollY < minScroll) return;
      scrolled = true;
      window.removeEventListener('scroll', onScroll);
      check();
    };
    const timer = setTimeout(() => { timeUp = true; check(); }, delay);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (hiddenPath || gone || !ready || !mode) return null;

  const t = T[lang];
  const later = () => {
    try { localStorage.setItem(LATER_KEY, String(Date.now())); } catch { /* storage blocked */ }
    setGone(true);
  };
  const install = async () => {
    const ev = deferred.current;
    if (!ev) { setGone(true); return; }
    deferred.current = null;
    try {
      ev.prompt();
      const choice = await ev.userChoice;
      if (choice?.outcome === 'dismissed') { later(); return; }
    } catch { /* prompt unavailable */ }
    setGone(true);
  };

  return (
    <aside className="qw-install" data-no-i18n="" dir={lang === 'en' ? 'ltr' : 'rtl'} lang={lang} role="region" aria-label={t.label}>
      <div className="qw-install-head">
        <img className="qw-install-logo" src="/icons/icon-192.png" alt="" width="44" height="44" />
        <div className="qw-install-txt">
          <b className="qw-install-title">{t.title}</b>
          {mode === 'android' && <span className="qw-install-sub">{t.sub}</span>}
        </div>
      </div>
      {mode === 'ios' && (
        <ol className="qw-install-steps">
          <li><span className="qw-install-ico"><ShareGlyph /></span><span>{t.ios1}</span></li>
          <li><span className="qw-install-ico"><AddGlyph /></span><span>{t.ios2}</span></li>
        </ol>
      )}
      <div className="qw-install-acts">
        {mode === 'android' && <button type="button" className="qw-install-go" onClick={install}>{t.install}</button>}
        <button type="button" className="qw-install-later" onClick={later}>{t.later}</button>
      </div>
    </aside>
  );
}
