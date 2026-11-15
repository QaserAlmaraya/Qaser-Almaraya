'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Public-site page change: a short cross-fade (plus a few pixels of lift on
// the incoming page) instead of an abrupt swap, using the browser's View
// Transitions API.
//
// How it works: a click on an ordinary internal link is caught before React
// sees it. We ask the browser to photograph the current page, then start the
// navigation ourselves with router.push and tell the browser "the new page is
// ready" as soon as the pathname really changes. The keyframes live in
// app/qs-motion-page.css and only apply while <html> carries the class qm-vt.
//
// Browsers without the API, reduced-motion visitors and the dashboard are left
// exactly as they were: the click is not touched at all.

const SKIP_PATH = /^\/(admin|staff|api)(\/|$)/;
const WAIT_MS = 1200;   // slow network: stop holding the old page, let it swap as before
const LINGER_MS = 400;  // keep qm-vt a moment after the fade (see finish() below)

export default function PageTransition() {
  const path = usePathname() || '/';
  const router = useRouter();
  const pending = useRef(null);   // call it to tell the browser the new page is in the DOM

  // The new route has been committed: release the transition that is waiting.
  useEffect(() => {
    const done = pending.current;
    if (done) { pending.current = null; done(); }
  }, [path]);

  useEffect(() => {
    if (typeof document.startViewTransition !== 'function') return undefined;
    const root = document.documentElement;
    let busy = false, waitTimer = 0, lingerTimer = 0;

    const clearMarks = () => root.classList.remove('qm-vt', 'qm-vt-h');

    const onClick = (e) => {
      // Only a plain left click that nobody has already handled.
      if (busy || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (root.dataset.area !== 'site' || SKIP_PATH.test(window.location.pathname)) return;
      if (document.visibilityState !== 'visible') return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const t = e.target;
      const a = t && t.closest ? t.closest('a[href]') : null;
      if (!a || a.closest('[data-no-vt]')) return;
      if (a.hasAttribute('download')) return;
      const target = a.getAttribute('target');
      if (target && target !== '_self') return;
      const raw = a.getAttribute('href');
      if (!raw || raw.charAt(0) === '#') return;   // "#" links are in-page buttons (Site.jsx)

      let url;
      try { url = new URL(raw, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;   // also drops mailto:, tel:, wa.me
      if (SKIP_PATH.test(url.pathname)) return;
      // A file (PDF, image...) is not a page of the app: let the browser open it.
      if (/\.[a-z0-9]{2,5}$/i.test(url.pathname) || /\bexternal\b/.test(a.getAttribute('rel') || '')) return;
      // Same page (hash jump or a filter in the query string): nothing to fade.
      if (url.pathname === window.location.pathname) return;

      // From here the navigation is ours. Next's <Link> sees defaultPrevented
      // and stands down; the link's own onClick (e.g. "close the menu") still
      // runs because the event keeps travelling.
      e.preventDefault();
      busy = true;
      clearTimeout(lingerTimer);
      const from = window.location.pathname;
      const href = url.pathname + url.search + url.hash;

      root.classList.add('qm-vt');
      // Hold the sticky header still, unless the full-screen menu is open over
      // it (then the header would be drawn on top of the fading menu).
      if (!document.querySelector('.qn-menu')) root.classList.add('qm-vt-h');

      const finish = () => {
        busy = false;
        clearTimeout(waitTimer);
        pending.current = null;
        // Not removed at once: while qm-vt is on, the old page-enter slide
        // (.qa-page) is shortened to nothing so the two effects don't stack.
        // Dropping the class a little later means that slide is long over and
        // cannot replay.
        clearTimeout(lingerTimer);
        lingerTimer = setTimeout(clearMarks, LINGER_MS);
      };

      let vt = null;
      try {
        vt = document.startViewTransition(() => new Promise((resolve) => {
          let settled = false;
          const done = () => { if (!settled) { settled = true; clearTimeout(waitTimer); resolve(); } };
          pending.current = done;
          // Never freeze the page on a slow connection.
          waitTimer = setTimeout(done, WAIT_MS);
          try { router.push(href); } catch { done(); window.location.assign(href); return; }
          // A handler on the link itself (Site.jsx menu) may have navigated
          // already, before this callback ran: then there is nothing to wait for.
          if (window.location.pathname !== from) done();
        }));
      } catch {
        // The API refused to start: navigate the ordinary way.
        finish();
        clearMarks();
        try { router.push(href); } catch { window.location.assign(href); }
        return;
      }
      // A skipped transition (hidden tab, duplicate names...) rejects `ready`;
      // the navigation itself still happened, so there is nothing to report.
      if (vt.ready && vt.ready.catch) vt.ready.catch(() => {});
      if (vt.updateCallbackDone && vt.updateCallbackDone.catch) vt.updateCallbackDone.catch(() => {});
      if (vt.finished && vt.finished.then) vt.finished.then(finish, finish);
      else finish();
    };

    // Capture phase: we must run before React's own click handling.
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearTimeout(waitTimer); clearTimeout(lingerTimer);
      const done = pending.current;
      if (done) { pending.current = null; done(); }
      clearMarks();
    };
  }, [router]);

  return null;
}
