'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import CompareView from './CompareView';
import { COMPARE_MAX, useCompareIds, removeCompare, clearCompare, pruneCompare, onCompareFull } from './compareStore';

// The compare tray (fixed at the bottom once a package is ticked) and the
// comparison view it opens. Mounted once by the packages list, which hands it
// the same packages the cards are drawn from.
export default function CompareDock({ packages, lang = 'ar' }) {
  const en = lang === 'en';
  const ids = useCompareIds();
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [mounted, setMounted] = useState(false);
  const goRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Packages that are no longer offered leave the selection.
  useEffect(() => {
    if (Array.isArray(packages)) pruneCompare(packages.map((p) => p.id));
  }, [packages]);

  // A 4th tick: say why nothing happened, then let the note fade away.
  useEffect(() => {
    let timer = 0;
    const off = onCompareFull(() => {
      setFull(true);
      clearTimeout(timer);
      timer = setTimeout(() => setFull(false), 5000);
    });
    return () => { off(); clearTimeout(timer); };
  }, []);
  useEffect(() => { if (ids.length < COMPARE_MAX) setFull(false); }, [ids.length]);

  const chosen = useMemo(() => {
    const byId = new Map((Array.isArray(packages) ? packages : []).map((p) => [String(p.id), p]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }, [ids, packages]);

  useEffect(() => { if (open && chosen.length === 0) setOpen(false); }, [open, chosen.length]);

  if (!mounted || chosen.length === 0) return null;

  const nm = (p) => String((en && p.title_en) || p.title_ar || p.title_en || '').trim();
  const note = full
    ? (en ? `You can compare up to ${COMPARE_MAX} packages at a time. Remove one to add another.` : `يمكنك مقارنة ${COMPARE_MAX} باقات في المرة الواحدة. أزل واحدة لتضيف غيرها.`)
    : chosen.length === 1
      ? (en ? 'Pick one more package to compare.' : 'اختر باقة ثانية لتبدأ المقارنة.')
      : '';

  return createPortal(
    <>
      <aside className="qc-tray" data-no-i18n="" dir={en ? 'ltr' : 'rtl'} aria-label={en ? 'Package comparison' : 'مقارنة الباقات'}>
        <p className={'qc-note' + (full ? ' full' : '')} role="status" aria-live="polite">{note}</p>
        <div className="qc-tray-in">
          <span className="qc-tray-t">
            <Icon name="arrow-left-right" size={16} />
            <span>{en ? 'Compare' : 'المقارنة'}</span>
            <b>{chosen.length}/{COMPARE_MAX}</b>
          </span>
          <ul className="qc-chips">
            {chosen.map((p) => (
              <li key={p.id} className="qc-chip">
                <span className="qc-chip-t">{nm(p)}</span>
                <button type="button" className="qc-chip-x" onClick={() => removeCompare(p.id)} aria-label={(en ? 'Remove from comparison: ' : 'إزالة من المقارنة: ') + nm(p)}>
                  <Icon name="x" size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="qc-tray-act">
            <button type="button" className="qc-clear" onClick={clearCompare}>{en ? 'Clear' : 'مسح'}</button>
            <button type="button" ref={goRef} className="qa-amber qc-go" disabled={chosen.length < 2} onClick={() => setOpen(true)}>
              {en ? 'Compare now' : 'قارن الآن'}
            </button>
          </div>
        </div>
      </aside>
      {open ? <CompareView packages={chosen} lang={lang} onClose={() => { setOpen(false); goRef.current?.focus(); }} /> : null}
    </>,
    document.body
  );
}
