'use client';

// Command palette for the public site: quick actions plus a live search over
// the site's own packages and visa countries. Opened from the header's search
// widget or with Cmd/Ctrl+K (the shortcut itself is bound in nav/SiteNav.jsx).
//
// It is mounted by the headers only, so it never exists on /admin or /staff.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { openWhatsApp } from '../lib/whatsapp';

const WA_TEXT = {
  ar: 'مرحباً قصر المرايا، أرغب بالمساعدة في التخطيط لرحلتي.',
  en: 'Hello Qaser Almaraya, I would like some help planning my trip.',
};

// kw: extra words a visitor might type for this action, in either language.
const PAGES = [
  { id: 'packages', icon: 'luggage', ar: 'المجموعات والباقات', en: 'Groups & Packages', href: '/packages', kw: 'باقات رحلات مجموعات سياحة عمرة tours trips umrah' },
  { id: 'visa', icon: 'id-card', ar: 'التأشيرات', en: 'Visas', href: '/visa', kw: 'فيزا فيز تأشيرة سمة visa' },
  { id: 'flights', icon: 'plane', ar: 'الطيران والفنادق', en: 'Flights & Hotels', href: '/flights', kw: 'تذاكر حجز فندق طيران tickets booking hotel' },
  { id: 'guide', icon: 'compass', ar: 'دليل الوجهات', en: 'Travel guides', href: '/guide', kw: 'وجهات دول سفر destinations countries' },
  { id: 'fares', icon: 'banknote', ar: 'أسعار التذاكر', en: 'Ticket prices', href: '/flights', scrollTo: '#fares', kw: 'اسعار سعر تذكرة fares price' },
  { id: 'faq', icon: 'circle-help', ar: 'الأسئلة الشائعة', en: 'FAQ', href: '/faq', kw: 'اسئلة سؤال مساعدة questions help' },
  { id: 'jobs', icon: 'briefcase', ar: 'الوظائف', en: 'Careers', href: '/jobs', kw: 'وظيفة توظيف عمل careers work' },
  { id: 'contact', icon: 'mail', ar: 'تواصل معنا', en: 'Contact us', href: '/contact', kw: 'اتصال عنوان فروع بريد address branches email' },
];

// Arabic-insensitive matching: drop diacritics and tatweel, fold alef / ya / ta marbuta.
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fetched once, on the first open, and kept for the rest of the visit.
let dataCache = null;
let dataPromise = null;
function loadData() {
  if (dataCache) return Promise.resolve(dataCache);
  if (!dataPromise) {
    const get = (url) => fetch(url).then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);
    dataPromise = Promise.all([get('/api/packages'), get('/api/visa/cards')]).then(([pk, cards]) => {
      const packages = pk.filter((p) => p && p.id != null).map((p) => {
        const ar = p.title_ar || p.dest_ar || '';
        const en = p.title_en || p.dest_en || '';
        return { id: p.id, ar: ar || en, en: en || ar, subAr: p.dest_ar && p.dest_ar !== ar ? p.dest_ar : '', subEn: p.dest_en && p.dest_en !== en ? p.dest_en : '', hay: norm([p.title_ar, p.title_en, p.dest_ar, p.dest_en].filter(Boolean).join(' ')) };
      });
      const seen = new Map();
      cards.forEach((c) => {
        if (!c || c.country_id == null || seen.has(c.country_id)) return;
        const ar = c.country_name_ar || c.country_name_en || '';
        const en = c.country_name_en || c.country_name_ar || '';
        if (!ar && !en) return;
        seen.set(c.country_id, { id: c.country_id, ar, en, hay: norm(ar + ' ' + en) });
      });
      const out = { packages, countries: [...seen.values()] };
      // Nothing came back (offline, server error): do not cache, so the next open tries again.
      if (packages.length || seen.size) dataCache = out; else dataPromise = null;
      return out;
    });
  }
  return dataPromise;
}

function scrollWhenReady(selector) {
  let tries = 0;
  const tick = () => {
    const el = document.querySelector(selector);
    if (el) {
      const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    } else if (++tries < 40) setTimeout(tick, 100);
  };
  setTimeout(tick, 60);
}

export default function CommandPalette({ open, onClose, lang = 'ar', onToggleLang }) {
  const router = useRouter();
  const en = lang === 'en';
  const [q, setQ] = useState('');
  const [data, setData] = useState(dataCache);
  const [cursor, setCursor] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const restoreRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Open: remember what had focus, lock the page behind, load the data once.
  useEffect(() => {
    if (!open) return undefined;
    restoreRef.current = document.activeElement;
    setQ('');
    setCursor(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    let alive = true;
    loadData().then((d) => { if (alive) setData(d); });
    const t = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 0);
    return () => {
      alive = false;
      clearTimeout(t);
      document.body.style.overflow = prev;
      const el = restoreRef.current;
      if (el && typeof el.focus === 'function' && document.contains(el)) el.focus();
    };
  }, [open]);

  const groups = useMemo(() => {
    const t = (o) => (en ? o.en : o.ar);
    const pages = PAGES.map((p) => ({ key: 'p-' + p.id, icon: p.icon, label: t(p), hay: norm(p.ar + ' ' + p.en + ' ' + p.kw), run: { href: p.href, scrollTo: p.scrollTo } }));
    const contact = [
      { key: 'a-wa', icon: 'message-circle', label: en ? 'Message us on WhatsApp' : 'راسلنا عبر واتساب', hay: norm('واتساب واتس اب راسلنا محادثة whatsapp message chat'), run: { wa: true } },
      { key: 'a-call', icon: 'phone', label: en ? 'Call 6393' : 'اتصل 6393', hay: norm('اتصل اتصال هاتف رقم 6393 call phone'), run: { tel: '6393' } },
    ];
    const prefs = [
      { key: 'a-lang', icon: 'languages', label: en ? 'Switch to Arabic' : 'تغيير اللغة إلى الإنجليزية', hint: en ? 'العربية' : 'English', hay: norm('لغة انجليزي عربي english arabic language عربية'), run: { lang: true } },
    ];
    const nq = norm(q);
    if (!nq) {
      return [
        { id: 'pages', title: en ? 'Pages' : 'الصفحات', items: pages },
        { id: 'contact', title: en ? 'Quick contact' : 'تواصل سريع', items: contact },
        { id: 'prefs', title: en ? 'Settings' : 'الإعدادات', items: prefs },
      ];
    }
    const words = nq.split(' ');
    const hit = (hay) => words.every((w) => hay.includes(w));
    const d = data || { packages: [], countries: [] };
    const pk = d.packages.filter((p) => hit(p.hay)).slice(0, 6).map((p) => ({
      key: 'k-' + p.id, icon: 'luggage', label: en ? p.en : p.ar, hint: en ? p.subEn : p.subAr, run: { href: '/packages/' + p.id },
    }));
    const vs = d.countries.filter((c) => hit(c.hay)).slice(0, 6).map((c) => ({
      key: 'v-' + c.id, icon: 'id-card', label: en ? c.en : c.ar, hint: en ? 'Visa' : 'تأشيرة', run: { href: '/visa/country/' + c.id },
    }));
    const acts = [...pages, ...contact, ...prefs].filter((a) => hit(a.hay));
    const out = [];
    if (pk.length) out.push({ id: 'pk', title: en ? 'Packages' : 'الباقات', items: pk });
    if (vs.length) out.push({ id: 'vs', title: en ? 'Visas' : 'التأشيرات', items: vs });
    if (acts.length) out.push({ id: 'acts', title: en ? 'Quick actions' : 'إجراءات سريعة', items: acts });
    if (!out.length) out.push({ id: 'none', title: en ? 'Ask us instead' : 'اسألنا مباشرة', items: contact });
    return out;
  }, [q, data, en]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const noMatch = groups.length === 1 && groups[0].id === 'none';
  const active = Math.min(cursor, Math.max(flat.length - 1, 0));

  useEffect(() => { setCursor(0); }, [q]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector('[data-active="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [active, open, groups]);

  if (!mounted || !open) return null;

  function run(item) {
    if (!item) return;
    const r = item.run;
    if (r.lang) { onClose(); if (onToggleLang) onToggleLang(); return; }
    if (r.wa) { onClose(); openWhatsApp(en ? WA_TEXT.en : WA_TEXT.ar); return; }
    if (r.tel) { onClose(); window.location.href = 'tel:' + r.tel; return; }
    onClose();
    if (r.scrollTo && window.location.pathname === r.href) { scrollWhenReady(r.scrollTo); return; }
    router.push(r.href);
    if (r.scrollTo) scrollWhenReady(r.scrollTo);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (flat.length) setCursor((active + 1) % flat.length); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (flat.length) setCursor((active - 1 + flat.length) % flat.length); return; }
    if (e.key === 'Enter' && e.target === inputRef.current) { e.preventDefault(); run(flat[active]); return; }
    if (e.key === 'Tab') {
      // Only the field and the close button take focus; keep Tab between them.
      const els = panelRef.current ? [...panelRef.current.querySelectorAll('input,button:not([tabindex="-1"])')] : [];
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!panelRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  }

  const activeId = flat[active] ? 'qn-cp-o-' + flat[active].key : undefined;
  let n = -1;

  return createPortal(
    <div className="qn-cp" data-no-i18n="" dir={en ? 'ltr' : 'rtl'} data-keep-dir="" onKeyDown={onKeyDown}>
      <div className="qn-cp-backdrop" onMouseDown={onClose} aria-hidden="true" />
      <div ref={panelRef} className="qn-cp-panel" role="dialog" aria-modal="true" aria-label={en ? 'Search and quick actions' : 'البحث والإجراءات السريعة'}>
        <div className="qn-cp-top">
          <Icon name="search" size={20} strokeWidth={1.8} className="qn-cp-topico" />
          <input
            ref={inputRef}
            className="qn-cp-input"
            type="text"
            inputMode="search"
            enterKeyHint="go"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={en ? 'Search for a package, a visa or a page' : 'ابحث عن باقة أو تأشيرة أو صفحة'}
            role="combobox"
            aria-expanded="true"
            aria-controls="qn-cp-list"
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            aria-label={en ? 'Search' : 'بحث'}
          />
          <button type="button" className="qn-cp-close" onClick={onClose} aria-label={en ? 'Close' : 'إغلاق'}>
            <span className="qn-cp-esc" dir="ltr" data-keep-dir="" aria-hidden="true">Esc</span>
            <Icon name="x" size={18} strokeWidth={2} className="qn-cp-x" />
          </button>
        </div>

        <div ref={listRef} id="qn-cp-list" className="qn-cp-list" role="listbox" aria-label={en ? 'Results' : 'النتائج'}>
          {noMatch ? <p className="qn-cp-empty">{en ? 'No matching results.' : 'لا توجد نتائج مطابقة.'}</p> : null}
          {groups.map((g) => (
            <div key={g.id} role="group" aria-labelledby={'qn-cp-g-' + g.id} className="qn-cp-group">
              <div id={'qn-cp-g-' + g.id} className="qn-cp-title">{g.title}</div>
              {g.items.map((it) => {
                n += 1;
                const i = n;
                const on = i === active;
                return (
                  <div
                    key={it.key}
                    id={'qn-cp-o-' + it.key}
                    role="option"
                    aria-selected={on}
                    data-active={on ? 'true' : undefined}
                    className="qn-cp-row"
                    onMouseMove={() => { if (cursor !== i) setCursor(i); }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => run(it)}
                  >
                    <span className="qn-cp-ico"><Icon name={it.icon} size={18} strokeWidth={1.8} /></span>
                    <span className="qn-cp-label">{it.label}</span>
                    {it.hint ? <span className="qn-cp-hint">{it.hint}</span> : null}
                    <span className="qn-cp-go" aria-hidden="true"><Icon name="corner-down-left" size={16} strokeWidth={1.8} /></span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="qn-cp-foot" aria-hidden="true">
          <span><kbd dir="ltr" data-keep-dir="">↑</kbd><kbd dir="ltr" data-keep-dir="">↓</kbd>{en ? 'Move' : 'تنقّل'}</span>
          <span><kbd dir="ltr" data-keep-dir="">↵</kbd>{en ? 'Open' : 'فتح'}</span>
          <span><kbd dir="ltr" data-keep-dir="">Esc</kbd>{en ? 'Close' : 'إغلاق'}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
