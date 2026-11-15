'use client';
import { useLangToggle } from '../lib/i18n';
import SiteNav from './nav/SiteNav';

// The same header as the one inside Site.jsx; both feed components/nav/SiteNav.jsx.
const PRIMARY = [
  { id: 'flights', href: '/flights', label: 'الطيران والفنادق', icon: 'plane' },
  { id: 'packages', href: '/packages', label: 'المجموعات والباقات', labelEn: 'Groups & Packages', icon: 'luggage' },
  { id: 'visas', href: '/visa', label: 'التأشيرات', icon: 'id-card' },
  { id: 'guide', href: '/guide', label: 'دليل الوجهات', labelEn: 'Travel guides', icon: 'compass' },
];
const MORE = [
  { id: 'jobs', href: '/jobs', label: 'الوظائف', icon: 'briefcase' },
  { id: 'faq', href: '/faq', label: 'الأسئلة الشائعة', icon: 'circle-help' },
  { id: 'contact', href: '/contact', label: 'تواصل معنا', icon: 'mail' },
];
const CTA = { href: '/contact', label: 'تواصل معنا' };

export default function SiteHeader({ active = 'التأشيرات' }) {
  const { lang, toggle } = useLangToggle();
  const mark = (list) => list.map((item) => ({ ...item, on: item.label === active }));
  return <SiteNav lang={lang} onToggleLang={toggle} home={{ href: '/' }} primary={mark(PRIMARY)} more={mark(MORE)} cta={CTA} />;
}
