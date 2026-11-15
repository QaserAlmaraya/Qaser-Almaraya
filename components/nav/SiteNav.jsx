'use client';

// The public header: logo, four primary links, a «المزيد» menu for the
// secondary ones, the search widget, the language toggle and one primary CTA.
// On narrow screens the links fold into the burger menu with the same grouping.
//
// Purely presentational. Both headers feed it:
//   components/SiteHeader.jsx — route pages, plain links;
//   components/Site.jsx       — the home/flights/... shell, its own click handlers.
// An item is { id, label, labelEn?, icon, on, href, onClick? }. With labelEn the
// label is rendered per language here; without it the DOM dictionary translates it.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Icon from '../Icon';
import CtaButton from '../CtaButton';
import SeasonDecor from '../SeasonDecor';
import CommandPalette from '../CommandPalette';

function NavLink({ item, lang, className, children, onAfter, ...rest }) {
  const text = item.labelEn && lang === 'en' ? item.labelEn : item.label;
  const props = {
    className,
    'aria-current': item.on ? 'page' : undefined,
    'data-i18n-short': item.labelEn ? undefined : '',
    'data-no-i18n': item.labelEn ? '' : undefined,
    ...rest,
  };
  const body = (
    <>
      {item.icon ? <Icon name={item.icon} size={17} strokeWidth={1.8} className="qn-ico" /> : null}
      <span>{text}</span>
      {children}
    </>
  );
  if (item.onClick) {
    return <a href={item.href || '#'} {...props} onClick={(e) => { if (onAfter) onAfter(); item.onClick(e); }}>{body}</a>;
  }
  return <Link href={item.href} {...props} onClick={onAfter}>{body}</Link>;
}

export default function SiteNav({
  lang = 'ar',
  onToggleLang,
  home = { href: '/' },
  primary = [],
  more = [],
  cta,
  menuOpen: menuOpenProp,
  setMenuOpen: setMenuOpenProp,
}) {
  const en = lang === 'en';
  const [menuOpenOwn, setMenuOpenOwn] = useState(false);
  const controlled = typeof setMenuOpenProp === 'function';
  const menuOpen = controlled ? !!menuOpenProp : menuOpenOwn;
  const setMenuOpen = controlled ? setMenuOpenProp : setMenuOpenOwn;

  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [kbd, setKbd] = useState(''); // filled after mount: the server cannot know the platform
  const [mounted, setMounted] = useState(false);
  const moreRef = useRef(null);
  const moreBtnRef = useRef(null);
  const menuRef = useRef(null);
  const burgerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const ua = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '';
    setKbd(/mac|iphone|ipad|ipod/i.test(ua) ? '⌘K' : 'Ctrl K');
  }, []);

  // Cmd+K / Ctrl+K anywhere on the page. e.code keeps it working on an Arabic layout.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.code !== 'KeyK' && String(e.key).toLowerCase() !== 'k') return;
      e.preventDefault();
      setMoreOpen(false);
      setPaletteOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // «المزيد»: a click or a focus move outside closes it.
  useEffect(() => {
    if (!moreOpen) return undefined;
    const outside = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside, { passive: true });
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [moreOpen]);

  // Burger menu: the page behind does not scroll, focus starts on the close button.
  useEffect(() => {
    if (controlled) return undefined; // Site.jsx already locks the page for its own state
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, controlled]);
  useEffect(() => {
    if (!menuOpen || !menuRef.current) return;
    const b = menuRef.current.querySelector('button');
    if (b) b.focus();
  }, [menuOpen]);

  const moreItems = () => (moreRef.current ? [...moreRef.current.querySelectorAll('.qn-more-item')] : []);
  function closeMore(refocus) {
    setMoreOpen(false);
    if (refocus && moreBtnRef.current) moreBtnRef.current.focus();
  }
  function onMoreKey(e) {
    if (e.key === 'Escape' && moreOpen) { e.preventDefault(); closeMore(true); return; }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    if (!moreOpen) {
      setMoreOpen(true);
      requestAnimationFrame(() => { const els = moreItems(); const el = e.key === 'ArrowUp' ? els[els.length - 1] : els[0]; if (el) el.focus(); });
      return;
    }
    const els = moreItems();
    if (!els.length) return;
    const i = els.indexOf(document.activeElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? els.length - 1 : e.key === 'ArrowDown' ? (i + 1) % els.length : (i - 1 + els.length) % els.length;
    els[next].focus();
  }

  function closeMenu() {
    setMenuOpen(false);
    if (burgerRef.current) burgerRef.current.focus();
  }
  function onMenuKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key !== 'Tab' || !menuRef.current) return;
    const els = [...menuRef.current.querySelectorAll('a[href],button')];
    if (!els.length) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  const moreOn = more.some((m) => m.on);
  const logoProps = {
    'aria-label': 'قصر المرايا للسفر و السياحة',
    className: 'qa-logo',
    style: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flex: 'none' },
  };
  const logoBody = (
    <>
      <img src="/assets/logo-mark-tight.webp" alt="" style={{ height: 38, width: 38, objectFit: 'contain', display: 'block', flex: 'none' }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.05 }}>
        <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--qs-brand-deep,#22a9d4)', whiteSpace: 'nowrap' }}>قصر المرايا</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--qs-ink-2,#5f666e)', whiteSpace: 'nowrap' }}>للسفر و السياحة</span>
      </span>
    </>
  );
  const langText = en ? 'ع' : 'EN';

  return (
    <>
      <header className="qn-header" style={{ position: 'sticky', top: 0, zIndex: 40, background: '#fff', borderBottom: '1px solid var(--qs-line,#ececed)', boxShadow: 'var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))' }}>
        <SeasonDecor />
        <div className="qa-head qn-head" style={{ maxWidth: 1240, margin: '0 auto', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
          {home.onClick
            ? <a href={home.href || '/'} onClick={home.onClick} {...logoProps}>{logoBody}</a>
            : <Link href={home.href || '/'} {...logoProps}>{logoBody}</Link>}

          {/* Desktop links — hidden below 1024px via CSS */}
          <nav className="qa-navrow qn-nav" aria-label={en ? 'Main' : 'التنقل الرئيسي'} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {primary.map((item) => <NavLink key={item.id} item={item} lang={lang} className="qa-nav qn-link" />)}
            {more.length ? (
              <div className="qn-more" ref={moreRef} onKeyDown={onMoreKey}>
                <button
                  ref={moreBtnRef}
                  type="button"
                  className="qa-nav qn-link qn-more-btn"
                  aria-expanded={moreOpen}
                  aria-controls="qn-more-panel"
                  data-on={moreOn ? 'true' : undefined}
                  data-no-i18n=""
                  onClick={() => setMoreOpen((v) => !v)}
                >
                  <span>{en ? 'More' : 'المزيد'}</span>
                  <Icon name="chevron-down" size={16} strokeWidth={2} className="qn-chev" />
                </button>
                <div id="qn-more-panel" className="qn-more-panel" hidden={!moreOpen}>
                  {more.map((item) => <NavLink key={item.id} item={item} lang={lang} className="qn-more-item" onAfter={() => setMoreOpen(false)} />)}
                </div>
              </div>
            ) : null}
          </nav>

          <button
            type="button"
            className="qn-search"
            onClick={() => { setMoreOpen(false); setPaletteOpen(true); }}
            aria-haspopup="dialog"
            aria-keyshortcuts="Meta+K Control+K"
            aria-label={en ? 'Search the site' : 'البحث في الموقع'}
            data-no-i18n=""
          >
            <Icon name="search" size={18} strokeWidth={1.9} />
            <span className="qn-search-text">{en ? 'Search' : 'بحث'}</span>
            {kbd ? <kbd className="qn-kbd" dir="ltr" data-keep-dir="">{kbd}</kbd> : null}
          </button>

          <button type="button" onClick={onToggleLang} aria-label="Language" title="Language" data-no-i18n="" className="qa-langbtn qn-lang" style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', cursor: 'pointer' }}>
            <Icon name="globe" size={17} strokeWidth={1.8} />
            <span>{langText}</span>
          </button>

          {cta ? <CtaButton size="sm" className="qn-cta" href={cta.onClick ? undefined : cta.href} onClick={cta.onClick} label={cta.label} labelEn={cta.labelEn} lang={lang} /> : null}

          {/* Burger — shown below 1024px via CSS */}
          <button
            ref={burgerRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="القائمة"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            className="qa-burger"
            style={{ display: 'none', flex: 'none', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, border: 0, borderRadius: 'var(--tw-radius-sm,10px)', background: 'var(--qs-band,#049dc5)', color: '#fff', cursor: 'pointer' }}
          >
            <Icon name="menu" size={22} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {/* Burger menu. Portalled: the header's backdrop-filter would otherwise trap a fixed child. */}
      {mounted && menuOpen ? createPortal(
        <div ref={menuRef} className="qa-mobilemenu qn-menu" role="dialog" aria-modal="true" aria-label="القائمة" dir={en ? 'ltr' : 'rtl'} onKeyDown={onMenuKey}>
          <div className="qn-menu-top">
            <button type="button" className="qn-menu-close" onClick={closeMenu} aria-label="إغلاق">
              <Icon name="x" size={20} strokeWidth={2.2} />
            </button>
          </div>

          <nav className="qn-menu-nav">
            {primary.map((item) => <NavLink key={item.id} item={item} lang={lang} className="qn-menu-link" onAfter={() => setMenuOpen(false)} />)}
            {more.length ? <div className="qn-menu-title" data-no-i18n="">{en ? 'More' : 'المزيد'}</div> : null}
            {more.map((item) => <NavLink key={item.id} item={item} lang={lang} className="qn-menu-link qn-menu-sub" onAfter={() => setMenuOpen(false)} />)}
          </nav>

          <div className="qn-menu-foot">
            <button type="button" onClick={onToggleLang} data-no-i18n="" className="qn-menu-lang">
              <Icon name="globe" size={17} strokeWidth={1.8} />
              <span>{langText}</span>
            </button>
            {cta ? (
              <CtaButton
                tone="light"
                className="qn-menu-cta"
                href={cta.onClick ? undefined : cta.href}
                onClick={(e) => { setMenuOpen(false); if (cta.onClick) cta.onClick(e); }}
                label={cta.label}
                labelEn={cta.labelEn}
                lang={lang}
              />
            ) : null}
          </div>
        </div>,
        document.body
      ) : null}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} lang={lang} onToggleLang={onToggleLang} />
    </>
  );
}
