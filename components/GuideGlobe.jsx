'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import createGlobe from 'cobe';
import Icon from './Icon';
import { imgProps } from '../lib/img';
import { formatPrice } from '../lib/currency';
import { flagUrl, nightsLabel, packageCountries } from '../lib/destinations';
import { loadPackages } from '../lib/publicPackages';
import { waLink } from '../lib/whatsapp';

// A light dotted globe for the destination guide (Owner, 8 Nov 2026: "a globe
// like rahal"). cobe draws the dots in WebGL (≈6 KB); the pins are ordinary
// buttons laid over the canvas, so they can be tapped, focused and read by
// screen readers. Pressing a pin selects that country: the globe turns to it
// and the panel beside the globe (under it on a phone) lists that country's
// packages, with the country's guide one tap away. The globe turns slowly,
// can be dragged, and a hovered card turns it to that country. If WebGL is not
// available the globe hides itself (panel included) and the country cards
// below do the job.

const PANEL_ID = 'qm-globe-panel';
const MAX_ROWS = 3;
// A press that moved further than this was a drag of the globe, not a tap.
const TAP_SLOP = 6;

// Guide city of each country (lat, lng).
export const GUIDE_COORDS = {
  tr: [41.01, 28.98], tn: [36.81, 10.18], om: [23.59, 58.38], eg: [27.92, 34.33], my: [3.14, 101.69],
  mv: [4.18, 73.51], id: [-8.34, 115.09], th: [13.76, 100.5], sg: [1.35, 103.82], lb: [33.89, 35.5],
  ae: [25.2, 55.27], jo: [31.95, 35.91], bh: [26.23, 50.59], sa: [21.39, 39.86], cn: [23.13, 113.26],
  ma: [31.63, -7.99], us: [40.71, -74.01], it: [41.9, 12.5], gb: [51.51, -0.13], ge: [41.72, 44.83],
  lk: [6.93, 79.86], fr: [48.86, 2.35], qa: [25.29, 51.53], kh: [13.36, 103.86],
};
const BAGHDAD = [33.31, 44.37];

const rad = (d) => (d * Math.PI) / 180;
// Same sphere point cobe uses for a marker.
function toVec([lat, lng]) {
  const r = rad(lat);
  const a = rad(lng) - Math.PI;
  const c = Math.cos(r);
  return [-c * Math.cos(a), Math.sin(r), c * Math.sin(a)];
}
// Rotate like cobe's shader (phi around the vertical axis, then theta).
function project(v, phi, theta) {
  const [x, y, z] = v;
  const cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(theta), st = Math.sin(theta);
  const x1 = cp * x + sp * z;
  const z1 = -sp * x + cp * z;
  const y2 = ct * y - st * z1;
  const z2 = st * y + ct * z1;
  return [x1, y2, z2];
}
// phi that brings a longitude to the front.
const phiFor = (lng) => Math.PI - (rad(lng) - Math.PI / 2);

export default function GuideGlobe({ countries, lang = 'ar', focus = null }) {
  const en = lang === 'en';
  const canvasRef = useRef(null);
  const boxRef = useRef(null);
  const pinsRef = useRef({});
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const state = useRef({ phi: phiFor(BAGHDAD[1]), theta: 0.28, target: null, drag: null, vel: 0.0032, size: 0, hold: false, moved: 0 });
  const [ok, setOk] = useState(true);
  const [hover, setHover] = useState(null);
  const [sel, setSel] = useState(null);
  // null while /api/packages is loading, then the list ([] if it failed).
  const [pkgs, setPkgs] = useState(null);

  // A hovered card turns the globe, but not while a country is selected:
  // the selected pin should stay in front of its panel.
  useEffect(() => {
    if (focus && !sel && GUIDE_COORDS[focus]) state.current.target = phiFor(GUIDE_COORDS[focus][1]);
  }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps

  // One request for the whole page view (loadPackages keeps the promise), so
  // choosing another country never refetches. A failed request resolves to an
  // empty list, which the panel shows as "no packages right now".
  useEffect(() => {
    if (!ok) return undefined;
    let alive = true;
    loadPackages().then((list) => { if (alive) setPkgs(Array.isArray(list) ? list : []); });
    return () => { alive = false; };
  }, [ok]);

  // Selecting turns the globe to the country and stops the slow spin, so the
  // pin does not drift away while the visitor reads the panel.
  useEffect(() => {
    const st = state.current;
    st.hold = !!sel;
    if (!sel || !GUIDE_COORDS[sel]) return undefined;
    st.target = phiFor(GUIDE_COORDS[sel][1]);
    // On a phone the panel sits under the globe; bring it into view if it is
    // off screen ('nearest' does nothing when it is already visible).
    const raf = requestAnimationFrame(() => {
      const el = panelRef.current;
      if (!el) return;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try { el.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); } catch { /* old browsers */ }
    });
    return () => cancelAnimationFrame(raf);
  }, [sel]);

  // Clear the selection; if the keyboard focus was inside the globe (close
  // button, a package row) hand it back to the pin so it is not lost.
  const clear = () => {
    const pin = sel && pinsRef.current[sel];
    const inside = rootRef.current && rootRef.current.contains(document.activeElement);
    setSel(null);
    if (inside && pin && pin.tabIndex === 0) pin.focus();
  };
  const clearRef = useRef(clear);
  clearRef.current = clear;

  // Escape closes the panel. Listened on the document because Safari does not
  // focus a button on click, so a key handler on the globe would miss it.
  useEffect(() => {
    if (!sel) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) clearRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sel]);

  const selC = sel ? countries.find((c) => c.iso === sel) || null : null;
  // Same match as the country filter on /packages (packageCountries), in the
  // same order that page lists a country's packages: shortest, then cheapest.
  const matches = useMemo(() => {
    if (!sel || !pkgs) return [];
    return pkgs
      .filter((p) => p && packageCountries(p).includes(sel))
      .sort((a, b) => (Number(a.nights) || 0) - (Number(b.nights) || 0) || (Number(a.price) || 0) - (Number(b.price) || 0));
  }, [sel, pkgs]);

  const isoKey = countries.map((c) => c.iso).join(',');
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return undefined;
    let globe = null;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const measure = () => {
      state.current.size = box.offsetWidth;
      canvas.width = state.current.size * dpr;
      canvas.height = state.current.size * dpr;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: state.current.size * dpr,
        height: state.current.size * dpr,
        phi: state.current.phi,
        theta: state.current.theta,
        dark: 0,
        diffuse: 3,
        mapSamples: 16000,
        mapBrightness: 6,
        mapBaseBrightness: 0.04,
        baseColor: [0.55, 0.85, 0.95],   // light sky, like the Instagram posts
        markerColor: [0.98, 0.67, 0.09],
        glowColor: [0.86, 0.95, 1],
        opacity: 0.95,
        markers: [],   // the pins are HTML links laid over the canvas
        onRender: (s) => {
          const st = state.current;
          if (st.target != null) {
            // shortest turn to the target longitude
            let d = ((st.target - st.phi + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
            // reduced motion: jump there instead of sweeping the globe round
            st.phi += reduce ? d : d * 0.08;
            if (reduce || Math.abs(d) < 0.002) st.target = null;
          } else if (!st.drag && !reduce && !st.hold) st.phi += st.vel;
          s.phi = st.phi;
          s.theta = st.theta;
          s.width = st.size * dpr;
          s.height = st.size * dpr;
          // move the HTML pins with the globe
          const R = st.size / 2;
          for (const iso in pinsRef.current) {
            const el = pinsRef.current[iso];
            const ll = iso === 'home' ? BAGHDAD : GUIDE_COORDS[iso];
            if (!el || !ll) continue;
            const [x, y, z] = project(toVec(ll), st.phi, st.theta);
            const vis = z > 0.12;
            el.style.transform = `translate(${R + x * R * 0.8}px, ${R - y * R * 0.8}px)`;
            el.style.opacity = vis ? String(Math.min(1, z * 2)) : '0';
            el.style.pointerEvents = vis ? 'auto' : 'none';
            el.tabIndex = vis ? 0 : -1;
          }
        },
      });
      requestAnimationFrame(() => { canvas.style.opacity = '1'; });
    } catch (e) {
      setOk(false);
    }
    return () => { ro.disconnect(); if (globe) globe.destroy(); };
  }, [isoKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const down = (e) => { state.current.drag = { x: e.clientX, phi: state.current.phi }; state.current.target = null; state.current.moved = 0; };
  const move = (e) => {
    const d = state.current.drag;
    if (!d) return;
    state.current.moved = Math.max(state.current.moved, Math.abs(e.clientX - d.x));
    state.current.phi = d.phi + (e.clientX - d.x) / 160;
  };
  const up = () => { state.current.drag = null; };
  // The pin travels with the globe, so a drag that began on a pin still ends
  // as a click on it; ignore those. Keyboard clicks (detail 0) always count.
  const pick = (e, iso) => {
    if (e.detail !== 0 && state.current.moved > TAP_SLOP) return;
    setSel((cur) => (cur === iso ? null : iso));
  };

  if (!ok) return null;
  const nm = (ar, enText) => (en && enText ? enText : ar);
  const selName = selC ? (en ? selC.en : selC.ar) : '';
  const loading = !!selC && pkgs === null;
  return (
    <div className="qs-globe qm-globe" data-no-i18n="" ref={rootRef}>
      <div className="qs-globe-box" ref={boxRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
        <canvas ref={canvasRef} className="qs-globe-canvas" aria-hidden="true" />
        <span className="qs-globe-pin home" ref={(el) => { pinsRef.current.home = el; }} aria-hidden="true">
          <i /><b>{en ? 'Baghdad' : 'بغداد'}</b>
        </span>
        {countries.filter((c) => GUIDE_COORDS[c.iso]).map((c) => (
          <button
            key={c.iso}
            type="button"
            className={'qs-globe-pin qm-pin' + (sel === c.iso ? ' on qm-sel' : hover === c.iso || (!sel && focus === c.iso) ? ' on' : '')}
            ref={(el) => { pinsRef.current[c.iso] = el; }}
            onClick={(e) => pick(e, c.iso)}
            onMouseEnter={() => setHover(c.iso)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(c.iso)}
            onBlur={() => setHover(null)}
            aria-pressed={sel === c.iso}
            aria-controls={PANEL_ID}
            aria-label={(en ? 'Show trips to ' : 'عرض الرحلات إلى ') + (en ? c.en : c.ar)}
          >
            <i /><b>{en ? c.en : c.ar}</b>
          </button>
        ))}
      </div>

      {/* Always in the page (empty state = the hint), so screen readers treat
          it as a live region and the globe does not jump when it fills. */}
      <div
        className={'qm-gp' + (selC ? ' qm-gp-open' : '')}
        id={PANEL_ID}
        ref={panelRef}
        role="region"
        aria-live="polite"
        aria-busy={loading}
        aria-label={en ? 'Trips to the selected country' : 'رحلات الدولة المختارة'}
      >
        {!selC ? (
          <p className="qm-gp-idle">
            <Icon name="map-pin" size={18} />
            <span>{en ? 'Drag the globe, then tap a pin to see that country\u2019s trips.' : 'حرّك الكرة واضغط على أي دبوس لعرض رحلات تلك الدولة.'}</span>
          </p>
        ) : (
          // keyed by country so the card fades in again for each new choice
          <div className="qm-gp-card" key={selC.iso}>
            <div className="qm-gp-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="qm-gp-flag" src={flagUrl(selC.iso)} alt="" width="40" height="28" />
              <div className="qm-gp-title">
                <h2>{selName}</h2>
                <Link href={'/guide/' + selC.iso} className="qm-gp-guide">{en ? 'Destination guide' : 'دليل الوجهة'}</Link>
              </div>
              <button type="button" className="qm-gp-close" onClick={clear} aria-label={en ? 'Close' : 'إغلاق'}>
                <Icon name="x" size={16} />
              </button>
            </div>

            {loading ? (
              <div className="qm-gp-list" aria-hidden="true">
                {[0, 1, 2].map((i) => <span key={i} className="qm-gp-skel" />)}
              </div>
            ) : matches.length > 0 ? (
              <>
                <ul className="qm-gp-list">
                  {matches.slice(0, MAX_ROWS).map((p, i) => {
                    const nights = nightsLabel(p, lang);
                    return (
                      <li key={p.id} style={{ '--qm-i': i }}>
                        <Link href={'/packages/' + p.id} className="qm-gp-row">
                          <span className="qm-gp-thumb">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {p.image_url ? <img {...imgProps(p.image_url, '72px', [384])} alt="" loading="lazy" decoding="async" /> : null}
                          </span>
                          <span className="qm-gp-text">
                            <b>{nm(p.title_ar, p.title_en)}</b>
                            {nights ? <span className="qm-gp-meta">{nights}</span> : null}
                            {/* The public selling price in dinars, exactly as the package cards print it. */}
                            {Number(p.price) > 0 ? (
                              <span className="qm-gp-price"><small>{en ? 'From' : 'يبدأ من'}</small> {formatPrice(p.price, 'IQD', lang)}</span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {/* /packages reads ?q=<country name> and turns it into its country filter. */}
                <Link href={'/packages?q=' + encodeURIComponent(selC.ar)} className="qm-gp-all">
                  {en ? `All packages to ${selName}` : `كل باقات ${selName}`}{matches.length > MAX_ROWS ? ` (${matches.length})` : ''}
                </Link>
              </>
            ) : (
              <div className="qm-gp-empty">
                <p>{en ? `There are no packages to ${selName} right now. Ask us and we will plan the trip for you.` : `لا توجد باقات إلى ${selName} حالياً. راسلنا ونرتّب لك الرحلة.`}</p>
                <div className="qm-gp-actions">
                  <a
                    className="qm-gp-wa"
                    href={waLink(en ? `Hello, I would like to ask about trips to ${selName}.` : `مرحباً، أود الاستفسار عن الرحلات إلى ${selName}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {en ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}
                  </a>
                  <Link href={'/guide/' + selC.iso} className="qm-gp-ghost">{en ? 'Destination guide' : 'دليل الوجهة'}</Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
