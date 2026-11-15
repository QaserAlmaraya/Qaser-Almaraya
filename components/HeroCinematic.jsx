'use client';
import { imgProps } from '../lib/img';
import Icon from './Icon';
import CtaButton from './CtaButton';
import { useEffect, useRef, useState } from 'react';

const SLIDE_MS = 7000;
const FADE_MS = 1400;

/**
 * Destination hero: one photograph, one copy panel, one primary action.
 *
 * Desktop  — the photo fills the section; the copy sits on a frosted panel on
 *            the inline-start side, so the picture shows through and around it.
 * Mobile   — a 4:5 crop of the same photo on top, the copy below it on white,
 *            which is the only way the Arabic stays comfortably readable.
 *
 * slides: [{ type: 'video'|'image', url, poster?, caption? }]
 */
// The last word of the headline carries the amber accent ("رحلتك تبدأ معنا").
function Title({ text }) {
  const t = String(text || '').trim();
  const cut = t.lastIndexOf(' ');
  if (cut < 1) return <span className="qh-accent">{t}</span>;
  return <>{t.slice(0, cut)} <span className="qh-accent">{t.slice(cut + 1)}</span></>;
}

export default function HeroCinematic({ slides: allSlides = [], kicker, title, subtitle, primary, secondary, jump, lang = 'ar' }) {
  const [active, setActive] = useState(0);
  // Pause only while the browser tab is hidden (the hero owns the first
  // screen, so pausing on hover would stop it for good).
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const on = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  const [reduced, setReduced] = useState(false);
  const [lite, setLite] = useState(false);
  // Videos get their source only once the client has mounted, so the poster
  // photo paints first and the download never blocks the first screen.
  const [ready, setReady] = useState(false);
  // Intrinsic width/height of each video slide, read from its own metadata.
  // On phones the media box takes the active video's ratio instead of the
  // 4:5 photo crop, so a cartoon frame is never cut in half.
  const [vidRatios, setVidRatios] = useState({});
  const videoRefs = useRef([]);

  useEffect(() => {
    try { setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch {}
    // Phones get the video too (the owner asked for it back on 6 Nov 2026).
    // Only data saver and genuinely slow connections fall back to the poster
    // photos, because the video is several megabytes.
    try {
      const c = navigator.connection;
      if (c && (c.saveData || /(^|-)2g/.test(c.effectiveType || ''))) setLite(true);
    } catch {}
    setReady(true);
  }, []);

  // In lite mode a video slide shows its poster photo; a video with no poster
  // is skipped, unless it is the only slide.
  const photoOnly = allSlides.filter((s) => s.type !== 'video' || s.poster);
  const slides = (lite || reduced) && photoOnly.length ? photoOnly : allSlides;
  const count = slides.length;

  // Auto-advance
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const id = setTimeout(() => setActive((a) => (a + 1) % count), SLIDE_MS);
    return () => clearTimeout(id);
  }, [active, count, paused]);

  // Only the visible video plays (saves data on phones)
  useEffect(() => {
    if (!ready) return;
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) { v.currentTime = 0; const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
    });
  }, [active, ready, lite]);

  // Keep the active index valid when the slide list shrinks (lite mode)
  useEffect(() => { if (active >= count && count) setActive(0); }, [active, count]);

  const current = slides[active] || {};
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  // Phones: a video keeps its own shape (within sane bounds); a photograph
  // keeps the deliberate 4:5 portrait crop.
  const showingVideo = current.type === 'video' && !reduced && !(lite && current.poster);
  const r = showingVideo ? vidRatios[active] : null;
  const mobileRatio = r ? `${Math.min(Math.max(r, 0.62), 1.78)}` : '0.8';

  return (
    <section className={'qh' + (paused ? ' paused' : '')} dir={dir} data-no-i18n="">
      <style>{`
.qh{position:relative;height:min(84vh,800px);min-height:600px;overflow:hidden;background:#0d141c;color:#fff;isolation:isolate}
.qh-media{position:absolute;inset:0;z-index:0;overflow:hidden;background:#0d141c}
.qh-slide{position:absolute;inset:0;opacity:0;transition:opacity ${FADE_MS}ms ease;z-index:0}
.qh-slide.on{opacity:1;z-index:1}
.qh-slide img,.qh-slide video{width:100%;height:100%;object-fit:cover;object-position:var(--qh-pos,50% 40%);display:block}
.qh-slide.on img{animation:qh-zoom ${SLIDE_MS + FADE_MS}ms ease-out both}
@keyframes qh-zoom{from{transform:scale(1.08)}to{transform:scale(1)}}
/* Legibility scrim only: a soft charcoal fall-off along the bottom edge, where
   the slide caption and the progress bars sit. The copy has its own panel. */
.qh-scrim{position:absolute;inset:0;z-index:2;background:linear-gradient(to top,rgba(13,20,28,.56) 0%,rgba(13,20,28,0) 36%)}
/* The copy sits on a frosted panel, so the photograph shows through it and
   the charcoal type stays readable over any slide, dark or light. */
.qh-copy{position:absolute;z-index:4;top:44%;transform:translateY(-50%);inset-inline-start:max(32px,calc((100% - 1240px) / 2));inset-inline-end:auto;box-sizing:border-box;width:min(520px,calc(100% - 64px));padding:32px;display:flex;flex-direction:column;align-items:flex-start;text-align:start;gap:16px;border-radius:20px;border:1px solid rgba(255,255,255,.6);background:rgba(255,255,255,.82);-webkit-backdrop-filter:blur(20px) saturate(1.3);backdrop-filter:blur(20px) saturate(1.3);color:#1d2733}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.qh-copy{background:#fff;border-color:#dbe8ee}}
.qh-copy>*{animation:qh-rise .8s cubic-bezier(.2,.7,.2,1) both}
.qh-copy>:nth-child(2){animation-delay:.08s}.qh-copy>:nth-child(3){animation-delay:.16s}.qh-copy>:nth-child(4){animation-delay:.24s}.qh-copy>:nth-child(5){animation-delay:.32s}
@keyframes qh-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.qh-eyebrow{margin:0;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;line-height:1.6;color:#1d2733}
.qh-eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:#faab18}
html[data-area] .qh .qh-title{margin:0;color:#1d2733;font-family:var(--qs-sans,inherit)!important;font-size:32px!important;font-weight:700!important;line-height:1.3!important}
.qh-accent{position:relative;display:inline-block;color:#036f8c}
.qh-accent::after{content:"";position:absolute;inset-inline:2%;bottom:-.04em;height:3px;border-radius:99px;background:#faab18;transform-origin:right;transform:scaleX(0);animation:qh-line .9s .55s cubic-bezier(.2,.7,.2,1) forwards}
.qh[dir="ltr"] .qh-accent::after{transform-origin:left}
@keyframes qh-line{to{transform:scaleX(1)}}
.qh-sub{margin:0;font-size:17px;line-height:1.7;color:#3d4650}
.qh-ctas{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:8px;max-width:100%}
/* Secondary action: a quiet outlined button; the amber CtaButton is the one primary. */
.qh-btn.sec{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border-radius:999px;border:1px solid #c3d6df;padding:0 20px;background:rgba(255,255,255,.7);color:#1d2733;font-family:inherit;font-size:15px;font-weight:600;text-decoration:none;transition:background-color .18s ease,border-color .18s ease}
.qh-btn.sec:hover{border-color:#1d2733;background:#fff;color:#1d2733}
.qh-btn:focus-visible{outline:2px solid #049dc5;outline-offset:3px}
.qh-jump{display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:500;color:#1d2733;text-decoration:none;border-bottom:1px solid rgba(29,39,51,.3);padding-bottom:4px;transition:border-color .18s ease}
.qh-jump:hover{color:#1d2733;border-color:#1d2733}
.qh-jump svg{transition:transform .25s cubic-bezier(.2,.7,.2,1)}
.qh-jump:hover svg{transform:translateY(3px)}
.qh-foot{position:absolute;z-index:5;inset-inline:0;bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding-inline:max(32px,calc((100% - 1240px) / 2))}
.qh-cap{display:inline-flex;align-items:center;min-height:32px}
/* Slide caption: a small frosted chip over the photograph. */
.qh-cap>span{display:inline-flex;align-items:center;gap:8px;padding:4px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.6);background:rgba(255,255,255,.82);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);color:#1d2733;font-size:13px;font-weight:600;line-height:1.7}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.qh-cap>span{background:#fff}}
.qh-bars{display:flex;gap:8px}
.qh-bar{width:clamp(24px,3vw,44px);height:4px;border-radius:4px;background:rgba(255,255,255,.4);overflow:hidden;cursor:pointer;border:0;padding:0}
.qh-bar i{display:block;height:100%;width:0;background:#fff}
.qh-bar.done i{width:100%;background:#fff}
.qh-bar.on i{animation:qh-fill ${SLIDE_MS}ms linear forwards}
.qh.paused .qh-bar.on i{animation-play-state:paused}
@keyframes qh-fill{to{width:100%}}
/* Phones: the photo (or a video at its own shape) on top, then the copy on
   plain white below it. No glass there: nothing shows through a panel that
   sits on a flat background. */
@media (max-width:820px){
  .qh{height:auto;min-height:0;max-height:none;background:#fff;color:#1d2733;overflow:visible;display:flex;flex-direction:column}
  .qh-media{order:1;position:relative;inset:auto;width:100%;aspect-ratio:var(--qh-mr,4/5);transition:aspect-ratio .3s ease}
  .qh-slide img{object-position:var(--qh-pos-m,50% 30%)}
  .qh-slide video{object-fit:contain;object-position:50% 50%;background:#0d141c}
  .qh-scrim{background:linear-gradient(to top,rgba(13,20,28,.5) 0%,rgba(13,20,28,0) 30%)}
  .qh-copy{order:2;position:relative;transform:none;inset:auto;top:auto;width:auto;padding:24px 16px 32px;gap:12px;border:0;border-radius:0;background:#fff;-webkit-backdrop-filter:none;backdrop-filter:none}
  html[data-area] .qh .qh-title{font-size:32px!important}
  .qh-ctas{flex-direction:column;align-items:stretch;width:100%;gap:12px}
  .qh-ctas>*{width:100%;max-width:100%;min-width:0;box-sizing:border-box}
  .qh-btn.sec{background:#fff}
  .qh-jump{align-self:center}
  .qh-foot{bottom:0;padding:24px 16px 12px}
}
@media (prefers-reduced-motion:reduce){
  .qh-copy>*,.qh-slide.on img{animation:none}
  .qh-accent::after{animation:none;transform:none}
  .qh-slide{transition:none}
  .qh-bar.on i{animation:none;width:100%}
  .qh-jump svg{transition:none}
  .qh-jump:hover svg{transform:none}
}
`}</style>
      <div className="qh-media" style={{ '--qh-mr': mobileRatio }}>
        {slides.map((s, i) => (
          <div key={i} className={'qh-slide' + (i === active ? ' on' : '')} aria-hidden={i !== active} style={{ '--qh-pos': s.pos || undefined, '--qh-pos-m': s.posMobile || undefined }}>
            {s.type === 'video' && !reduced && !(lite && s.poster) ? (
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={ready ? s.url : undefined}
                poster={s.poster || undefined}
                muted
                loop
                playsInline
                onLoadedMetadata={(e) => {
                  const { videoWidth: w, videoHeight: h } = e.currentTarget;
                  if (w && h) setVidRatios((m) => (m[i] ? m : { ...m, [i]: w / h }));
                }}
                preload={ready ? (i === 0 ? 'auto' : 'metadata') : 'none'}
                autoPlay={ready && i === 0}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img {...imgProps(s.type === 'video' ? s.poster || '' : s.url, '100vw', [640, 1080, 1920])} alt="" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} decoding={i === 0 ? 'sync' : 'async'} />
            )}
          </div>
        ))}
        <div className="qh-scrim" />

        <div className="qh-foot">
          <div className="qh-cap">
            {current.caption && (
              <span>
                <Icon name="map-pin" size={15} />
                {current.caption}
              </span>
            )}
          </div>
          {count > 1 && (
            <div className="qh-bars" role="tablist">
              {slides.map((_, i) => (
                <button key={i} type="button" aria-label={String(i + 1)} className={'qh-bar' + (i === active ? ' on' : i < active ? ' done' : '')} onClick={() => setActive(i)}>
                  <i key={i === active ? 'a' + active : 'x'} style={paused && i === active ? { animationPlayState: 'paused' } : undefined} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="qh-copy">
        {kicker && <p className="qh-eyebrow">{kicker}</p>}
        {title && <h1 className="qh-title"><Title text={title} /></h1>}
        {subtitle && <p className="qh-sub">{subtitle}</p>}
        <div className="qh-ctas">
          {primary && (
            <CtaButton label={primary.label} labelEn={primary.labelEn} lang={lang} onClick={primary.onClick} href={primary.href} />
          )}
          {secondary && <a className="qh-btn sec" href={secondary.href} {...(/^https?:/.test(secondary.href || '') ? { target: '_blank', rel: 'noopener' } : {})}>{secondary.icon ? <Icon name={secondary.icon} size={18} strokeWidth={2} /> : null}{secondary.label}</a>}
        </div>
        {jump && (
          <a className="qh-jump" href={jump.href}>
            {jump.label}
            <Icon name="chevron-down" size={16} strokeWidth={2} />
          </a>
        )}
      </div>
    </section>
  );
}
