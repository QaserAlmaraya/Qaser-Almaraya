'use client';

// The site's one primary action. At rest it reads as an ordinary amber button;
// on hover or keyboard focus the label slides away for a short "let's go" line
// and the plane leaves the button and flies back in from the other side.
//
// Both labels sit in the same grid cell, so the button is always as wide as the
// longer of the two and nothing around it moves. The hover line is decorative:
// it is hidden from assistive tech, and the accessible name stays the label.
//
//   <CtaButton href="/packages" label="تصفّح الباقات" labelEn="Browse packages" lang={lang} />
//   <CtaButton onClick={goContact} label="تواصل معنا" />
//
// Pass labelEn together with lang when the caller knows the language; without
// labelEn the label is left to the page's DOM dictionary (lib/i18n.js).
import Link from 'next/link';
import Icon from './Icon';

export default function CtaButton({
  href,
  onClick,
  label,
  labelEn,
  lang = 'ar',
  hover,
  hoverEn,
  tone = 'pri', // 'pri' = amber on charcoal text, 'brand' = brand cyan, 'light' = white (on a cyan band)
  size = 'md', // 'sm' for the header, 'md' default, 'lg' for the closing band
  external = false,
  className = '',
  ...rest
}) {
  const en = lang === 'en';
  const text = en && labelEn ? labelEn : label;
  const hoverText = en ? (hoverEn || "Let's go") : (hover || 'يلّا نسافر');
  const cls = ['qs-btn', 'qs-cta', 'qs-cta-' + tone, 'qs-cta-' + size, tone === 'pri' ? 'qs-btn-pri' : tone === 'brand' ? 'qs-btn-brand' : 'qs-btn-light', className].filter(Boolean).join(' ');

  const inner = (
    <>
      <span className="qs-cta-labels">
        <span className="qs-cta-rest" data-no-i18n={labelEn ? '' : undefined}>{text}</span>
        <span className="qs-cta-hover" aria-hidden="true" data-no-i18n="">{hoverText}</span>
      </span>
      <span className="qs-cta-ico" aria-hidden="true">
        <Icon name="plane" size={size === 'sm' ? 16 : 18} strokeWidth={2} />
      </span>
    </>
  );

  if (href && external) {
    return <a className={cls} href={href} target="_blank" rel="noopener" onClick={onClick} {...rest}>{inner}</a>;
  }
  if (href) {
    return <Link className={cls} href={href} onClick={onClick} {...rest}>{inner}</Link>;
  }
  return <button type="button" className={cls} onClick={onClick} {...rest}>{inner}</button>;
}
